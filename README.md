# AZ Business

An all-in-one business management system for Egyptian SMEs, built around
Egyptian Tax Authority (ETA) e-invoicing compliance.

Successor to [AZ Accounting](https://github.com/GhassanMazen00/accounting-prototype),
which is a customer receivables ledger. This project keeps that system's role
model and maker–checker review workflow and rebuilds the data layer on a proper
double-entry, append-only ledger.

**Status: Phase 1, database foundation.** No application code yet.

---

## Why the database comes first

Two rules decide whether this can ever be an accounting system, and both belong
in the database rather than in application code, so that no bug and no direct
SQL can bypass them:

1. **Every journal entry balances.** `SUM(debit) = SUM(credit)`, enforced by a
   deferred constraint trigger that fires at COMMIT.
2. **The ledger is append-only.** `UPDATE` and `DELETE` on `journal_entry` and
   `journal_line` are refused outright. Corrections happen by writing a
   reversing entry.

Rule 2 is what makes the system auditable. It is also a legal requirement: once
the Tax Authority has cleared an invoice, that invoice is immutable, and the
only lawful correction is a credit note.

AZ Accounting's data layer exposes `updateBill` and `deleteBill`. That is fine
for a private ledger and fatal for this one, which is why the schema starts
over rather than migrating.

## The fortunate accident

AZ Accounting's review workflow — a clerk drafts, a reviewer approves — maps
exactly onto correct accounting semantics. **The reviewer's approval is the
moment the document becomes immutable and posts to the ledger.** The workflow
was built for organisational reasons and turns out to be the right control
boundary, so it carried over unchanged.

```
draft ──submit──▶ pending_review ──approve──▶ posted ──cancel──▶ cancelled
  ▲                     │                       │
  └──────reject─────────┘                  (immutable;
                                        credit-note only
                                         once ETA-cleared)
```

## Layout

```
supabase/migrations/    schema, in order
  0001_foundation           extensions, identity helpers, enums
  0002_tenancy              companies, branches, users, the six roles
  0003_accounts_and_periods chart of accounts, fiscal calendar
  0004_ledger               journal entries + the two invariants
  0005_parties_items_taxes  customers, catalogue, Egyptian tax codes
  0006_documents            documents, lines, the freeze rule, totals
  0007_posting              document → ledger, workflow transitions
  0008_eta_queue            ETA submission queue, retry, audit log
  0009_rls                  multi-tenant isolation + role permissions
  0010_reporting            trial balance, statements, ageing, queue health
  0011_provisioning         one-call tenant setup w/ Egyptian CoA

db/tests/               113 assertions covering the invariants
scripts/test.sh         rebuild a scratch DB, migrate, run everything
```

## Running the tests

Needs a local PostgreSQL 16+ you can create databases on.

```bash
./scripts/test.sh
```

It drops and recreates `azb_test`, applies every migration in order, runs the
suite, and finishes with a two-session concurrency check on the ETA queue.

## Design notes

**Identity works the same locally and on Supabase.** `app.current_user_id()`
reads the `request.jwt.claims` GUC directly rather than calling `auth.uid()`,
so the exact same RLS policies run under `psql` in tests as run in production.

**Row level security carries the role model.** Note that a policy's `USING`
clause does not apply to `INSERT` — only `WITH CHECK` does. Every write policy
therefore repeats its role predicate in both. A test caught this the hard way:
an early version let a read-only viewer create customers.

**The ledger has no write policy at all.** It is written exclusively through
`SECURITY DEFINER` functions (`app.post_document`, `app.reverse_entry`). Even
an owner cannot `INSERT` into `journal_entry` from a client connection.

**Document numbers are gap-free.** Postgres sequences leak numbers on rollback,
which tax authorities do not accept, so `app.next_number()` uses a locked
counter row instead.

**ETA submission is decoupled from issuing.** A sale completes on local state
alone and clearance catches up. Egyptian connectivity is unreliable, the
authority permits a submission window, and a shop cannot stop selling because a
line is down — so the queue is load-bearing architecture, not an optimisation.
Workers lease rows with `FOR UPDATE SKIP LOCKED`, failures back off
exponentially to a one-hour cap, and a crashed worker's lease is reclaimed
after ten minutes.

## What is not built yet

Inventory, purchasing and costing; the general ledger reports beyond a trial
balance; POS and e-receipt; payroll; the ETA client itself (canonical
serialisation, hashing, e-seal signing); and any user interface.

The ETA client is the highest-uncertainty item and should be spiked against the
authority's preproduction environment before more is built on top of this.

## A note on validation

This schema encodes assumptions about how an Egyptian trading business
operates. Those assumptions have not yet been checked against a real business
keeping real books. That remains the largest risk in the project, and it is not
a risk that more code reduces.
