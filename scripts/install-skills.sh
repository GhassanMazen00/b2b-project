#!/usr/bin/env bash
# Installs the three design skills this page was built with.
# They are not committed: together they are about 43 MB.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$ROOT/.claude/skills"

git clone --depth 1 https://github.com/Leonxlnx/taste-skill     "$TMP/taste"
git clone --depth 1 https://github.com/pbakaus/impeccable       "$TMP/impeccable"
git clone --depth 1 https://github.com/emilkowalski/skills      "$TMP/emil"

cp -r "$TMP/taste/skills/taste-skill"              "$ROOT/.claude/skills/"
cp -r "$TMP/impeccable/.devin/skills/impeccable"   "$ROOT/.claude/skills/"
for d in "$TMP"/emil/skills/*/; do cp -r "$d" "$ROOT/.claude/skills/"; done

echo "installed into $ROOT/.claude/skills:"
ls "$ROOT/.claude/skills"
