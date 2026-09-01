#!/usr/bin/env bash
# Rebuilds a scratch database from the migrations, runs the suite, reports.
set -euo pipefail

DB="${AZB_TEST_DB:-azb_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

psql -d postgres -q -c "drop database if exists ${DB} with (force);"
psql -d postgres -q -c "create database ${DB};"

echo "── migrations ─────────────────────────────────────────"
for f in "${ROOT}"/supabase/migrations/*.sql; do
  printf '  %s\n' "$(basename "$f")"
  if ! psql -d "${DB}" -v ON_ERROR_STOP=1 -q -f "$f" 2>&1 \
       | grep -v NOTICE > /tmp/azb_mig.log; then :; fi
  if [ -s /tmp/azb_mig.log ]; then cat /tmp/azb_mig.log; fi
  psql -d "${DB}" -v ON_ERROR_STOP=1 -q -f /dev/null
done

echo "── tests ──────────────────────────────────────────────"
FAILED_FILES=0
for f in "${ROOT}"/db/tests/*.sql; do
  # PIPESTATUS keeps psql's exit code visible through the grep filter.
  # `|| true` would clobber PIPESTATUS, so relax errexit around the pipeline.
  set +e
  psql -d "${DB}" -v ON_ERROR_STOP=1 -q -f "$f" 2>&1 | grep -vE 'NOTICE|^$'
  rc=${PIPESTATUS[0]}
  set -e
  if [ "${rc}" -ne 0 ]; then
    echo "  !! $(basename "$f") aborted"
    FAILED_FILES=$((FAILED_FILES + 1))
  fi
done

psql -d "${DB}" -tA -F'  ' -c "
  select case when passed then '  ok  ' else ' FAIL ' end, name,
         coalesce(' -- ' || detail, '')
  from tst.result order by seq;"

read -r TOTAL PASSED <<<"$(psql -d "${DB}" -tA -F' ' -c \
  "select count(*), count(*) filter (where passed) from tst.result;")"

# TypeScript package: serialisation, hashing, and the worker end-to-end
# against the database this script just built.
if [ -d "${ROOT}/eta/node_modules" ]; then
  echo "── eta package ────────────────────────────────────────"
  ETA_RC=0
  ( cd "${ROOT}/eta" && AZB_TEST_DB="${DB}" npm test --silent 2>&1 \
      | grep -E "^# (pass|fail)|^not ok" ) || ETA_RC=1
else
  echo "── eta package ── skipped (run: cd eta && npm install)"
  ETA_RC=0
fi

# Two-session check that SQL alone cannot express.
psql -d "${DB}" -q -c "update eta_submission set state='pending',
  next_attempt_at=now(), locked_by=null, locked_at=null;"
CONC_RC=0
"${ROOT}/scripts/test_concurrency.sh" || CONC_RC=1

echo "───────────────────────────────────────────────────────"
if [ "${CONC_RC}" -ne 0 ]; then
  echo "  concurrency check FAILED"
  exit 1
fi
if [ "${ETA_RC}" -ne 0 ]; then
  echo "  eta package tests FAILED"
  exit 1
fi
if [ "${TOTAL}" -eq "${PASSED}" ] && [ "${TOTAL}" -gt 0 ] \
   && [ "${FAILED_FILES}" -eq 0 ]; then
  echo "  ${PASSED}/${TOTAL} passed"
else
  echo "  ${PASSED}/${TOTAL} assertions passed; ${FAILED_FILES} file(s) aborted"
  exit 1
fi
