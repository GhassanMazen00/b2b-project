#!/usr/bin/env bash
# Proves FOR UPDATE SKIP LOCKED across two real sessions: while session A holds
# an uncommitted claim, session B must skip that row rather than block on it or
# hand the same document to a second worker.
set -euo pipefail
DB="${AZB_TEST_DB:-azb_test}"

FIFO=$(mktemp -u); mkfifo "$FIFO"

# Session A: claim inside an open transaction, then wait to be told to commit.
(
  psql -d "$DB" -tA -q <<'SQL' > /tmp/azb_a.out 2>&1
begin;
select count(*) as a_claimed from app.claim_eta_submissions('worker-A', 10);
select pg_sleep(3);
commit;
SQL
) &
A_PID=$!

sleep 1  # let A take its locks

# Session B: must come back empty-handed, and must not hang.
timeout 10 psql -d "$DB" -tA -q -c \
  "select count(*) as b_claimed from app.claim_eta_submissions('worker-B', 10);" \
  > /tmp/azb_b.out 2>&1
B_RC=$?

wait $A_PID || true
rm -f "$FIFO"

A=$(grep -E '^[0-9]+$' /tmp/azb_a.out | head -1)
B=$(grep -E '^[0-9]+$' /tmp/azb_b.out | head -1)

echo "── concurrency ────────────────────────────────────────"
if [ "$B_RC" -eq 124 ]; then
  echo "  FAIL  session B blocked on session A's lock (SKIP LOCKED not working)"
  exit 1
fi
echo "    ok  session B did not block (returned in time)"

if [ "${A:-0}" -gt 0 ] && [ "${B:-0}" -eq 0 ]; then
  echo "    ok  session A claimed ${A}, session B claimed ${B} — no double dispatch"
else
  echo "  FAIL  A claimed ${A:-?}, B claimed ${B:-?} — expected A>0 and B=0"
  exit 1
fi
