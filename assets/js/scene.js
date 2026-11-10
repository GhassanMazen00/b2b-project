/**
 * BARQ — hero field.
 *
 * Thirty thousand points live in two states at once: a turbulent cloud, and
 * the exact pixels of the word برق. A single uniform moves between them, and
 * scrolling drives it. That is the whole idea of the studio in one image —
 * noise resolving into something deliberate.
 *
 * Everything degrades: fewer points on a phone, a still gradient with no
 * WebGL, and nothing moves at all under prefers-reduced-motion.
 */
import * as THREE from "../../vendor/three.module.min.js";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Samples every lit pixel of whatever is drawn onto an offscreen canvas, and
   returns the coordinates normalised to roughly [-1,1]. */
function sampleCanvas(draw, { width = 1024, height = 512, step = 2 } = {}) {
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.fillStyle = "#000"; x.fillRect(0, 0, width, height);
  x.fillStyle = "#fff";
  draw(x, width, height);

  const data = x.getImageData(0, 0, width, height).data;
  const pts = [];
  for (let py = 0; py < height; py += step) {
    for (let px = 0; px < width; px += step) {
      if (data[(py * width + px) * 4] > 128) {
        pts.push([(px / width - 0.5) * 2, -(py / height - 0.5) * 2]);
      }
    }
  }
  return pts;
}

/* The mark: a lightning bolt. Deliberately a polygon rather than a glyph —
   it needs no webfont, so it renders identically everywhere and cannot fall
   back to a typeface with no Arabic in it. It also reads the same in both
   languages, which a wordmark does not. */
const BOLT = [
  [0.575, 0.02], [0.205, 0.545], [0.455, 0.545],
  [0.335, 0.98], [0.800, 0.400], [0.545, 0.400], [0.735, 0.02],
];

function drawBolt(x, w, h) {
  // Fit the bolt to the canvas height, centred.
  const scale = h * 0.96;
  const ox = w / 2 - scale * 0.5;
  const oy = h * 0.02;
  x.beginPath();
  BOLT.forEach(([bx, by], i) => {
    const px = ox + bx * scale, py = oy + by * scale;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  });
  x.closePath();
  x.fill();
}

/* Kept for the alternative treatment: the Arabic wordmark. Only usable once
   the webfont has actually loaded at a weight that was requested. */
function drawWord(text, weight, size) {
  return (x, w, h) => {
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = `${weight} ${size}px "Readex Pro", system-ui, sans-serif`;
    x.fillText(text, w / 2, h / 2);
  };
}

const VERT = /* glsl */`
  uniform float uTime;
  uniform float uOrder;      // 0 = cloud, 1 = wordmark
  uniform float uSize;
  uniform vec2  uPointer;
  uniform float uStrike;

  attribute vec3  aHome;     // position inside the wordmark
  attribute vec3  aCloud;    // position in the drifting cloud
  attribute float aSeed;

  varying float vGlow;
  varying float vSeed;

  // Cheap layered turbulence. Real curl noise is prettier and costs far more
  // than it is worth at thirty thousand points on a mid-range phone.
  vec3 drift(vec3 p, float t, float seed) {
    float a = t * 0.22 + seed * 6.2831;
    return vec3(
      sin(a * 0.9 + p.y * 1.4) * 0.26 + sin(a * 0.31 + p.z * 0.7) * 0.14,
      cos(a * 0.7 + p.x * 1.1) * 0.22 + cos(a * 0.43 + p.z * 0.9) * 0.12,
      sin(a * 0.5 + p.x * 0.8) * 0.30
    );
  }

  void main() {
    vSeed = aSeed;

    vec3 cloud = aCloud + drift(aCloud, uTime, aSeed);

    // Ease the transition so points arrive at slightly different moments,
    // which reads as the word assembling rather than snapping.
    float stagger = clamp(uOrder * 1.35 - aSeed * 0.35, 0.0, 1.0);
    float e = stagger * stagger * (3.0 - 2.0 * stagger);
    vec3 pos = mix(cloud, aHome, e);

    // Pointer pushes the field away, gently, and only while it is a cloud.
    vec2 away = pos.xy - uPointer * 2.2;
    float d = length(away);
    pos.xy += normalize(away + 0.0001) * (0.18 / (1.0 + d * d * 5.0)) * (1.0 - e);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // A band of light sweeping across on each strike.
    float band = smoothstep(0.45, 0.0, abs(pos.x - (uStrike * 4.0 - 2.0)));
    vGlow = e * 0.42 + band * uStrike * 1.6 + 0.30;

    float size = uSize * (0.55 + aSeed * 0.9) * (1.0 - e * 0.42);
    gl_PointSize = size * (12.0 / -mv.z);
  }
`;

const FRAG = /* glsl */`
  precision mediump float;
  uniform vec3 uCold;
  uniform vec3 uHot;
  varying float vGlow;
  varying float vSeed;

  void main() {
    // Soft round sprite, no texture needed.
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    float alpha = smoothstep(0.5, 0.06, r);
    if (alpha < 0.01) discard;

    vec3 col = mix(uCold, uHot, clamp(vGlow * 0.8 + vSeed * 0.2, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha * clamp(vGlow, 0.0, 1.25) * 0.72);
  }
`;

export function createField(canvas, { shape = "bolt", word = "برق" } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: true, powerPreference: "high-performance",
    });
  } catch {
    return null;                       // caller falls back to the still gradient
  }
  if (!renderer.getContext()) return null;

  const dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 5.2;

  const phone = innerWidth < 760;
  const COUNT = phone ? 9000 : 30000;

  // Sample the bolt. If a wordmark is asked for instead and the font did not
  // load, the sample comes back nearly empty — fall back to the bolt rather
  // than to random noise, which looks like a bug.
  let glyph = [];
  if (shape === "word") {
    glyph = sampleCanvas(drawWord(word, 700, phone ? 180 : 230), { step: 2 });
    if (glyph.length < 600) glyph = [];
  }
  if (!glyph.length) glyph = sampleCanvas(drawBolt, { step: 2 });
  if (typeof window !== "undefined") window.__glyphCount = glyph.length;

  const home  = new Float32Array(COUNT * 3);
  const cloud = new Float32Array(COUNT * 3);
  const seed  = new Float32Array(COUNT);
  const pos   = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    const g = glyph.length
      ? glyph[(Math.random() * glyph.length) | 0]
      : [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 0.6];

    // Slight scatter keeps the letterforms from looking like a printed stencil.
    // The bolt is sampled from a 2:1 canvas, so x is scaled back to square.
    home[i * 3]     = g[0] * 0.86 + (Math.random() - 0.5) * 0.018;
    home[i * 3 + 1] = g[1] * 1.34 + (Math.random() - 0.5) * 0.018;
    home[i * 3 + 2] = (Math.random() - 0.5) * 0.12;

    const r = 1.1 + Math.random() * 1.9;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    cloud[i * 3]     = Math.sin(ph) * Math.cos(th) * r * 1.9;
    cloud[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * r * 1.15;
    cloud[i * 3 + 2] = Math.cos(ph) * r * 0.7;

    seed[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aHome",  new THREE.BufferAttribute(home, 3));
  geo.setAttribute("aCloud", new THREE.BufferAttribute(cloud, 3));
  geo.setAttribute("aSeed",  new THREE.BufferAttribute(seed, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);

  const uniforms = {
    uTime:    { value: 0 },
    uOrder:   { value: 0 },
    uSize:    { value: phone ? 2.6 : 2.2 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uStrike:  { value: 0 },
    uCold:    { value: new THREE.Color("#3C7BE0") },
    uHot:     { value: new THREE.Color("#DCEBFF") },
  };

  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(points);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
    pointer.ty = -(e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull the camera back on narrow screens so the word still fits.
    camera.position.z = w / h < 1 ? 7.6 : 5.2;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize, { passive: true });
  resize();

  let order = 0, target = 0, running = true, strike = 0, nextStrike = 2.5;
  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);

    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    order += (target - order) * (REDUCED ? 1 : 0.055);
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    if (!REDUCED) {
      nextStrike -= dt;
      if (nextStrike <= 0) { strike = 1; nextStrike = 5 + Math.random() * 6; }
      strike = Math.max(0, strike - dt * 1.6);
    }

    uniforms.uTime.value = REDUCED ? 0 : t;
    uniforms.uOrder.value = order;
    uniforms.uStrike.value = strike;
    uniforms.uPointer.value.set(pointer.x, pointer.y);

    points.rotation.y = pointer.x * 0.09 * (1 - order);
    points.rotation.x = pointer.y * 0.06 * (1 - order);

    renderer.render(scene, camera);
  }
  frame();

  // Stop entirely when the hero scrolls away — no reason to burn a phone's
  // battery rendering something nobody can see.
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; clock.start(); frame(); }
    else if (!e.isIntersecting) running = false;
  }, { threshold: 0 });
  io.observe(canvas);

  return {
    set order(v) {
      target = Math.max(0, Math.min(1, v));
      if (typeof window !== "undefined") window.__order = target;
    },
    get order() { return target; },
    strike() { strike = 1; },
    destroy() { running = false; io.disconnect(); renderer.dispose(); geo.dispose(); },
  };
}
