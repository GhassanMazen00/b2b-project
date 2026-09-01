-- =============================================================================
-- 0008  ETA submission queue and audit log
-- =============================================================================
-- Issuing an invoice and clearing it with the Tax Authority are deliberately
-- decoupled. A sale completes on local state alone; clearance catches up when
-- the network allows. This is not an optimisation -- Egyptian connectivity is
-- unreliable, the authority permits a submission window, and a shop cannot
-- stop selling because a line is down.
-- =============================================================================

create table eta_submission (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenant(id) on delete cascade,
  document_id     uuid not null references document(id) on delete cascade,

  state           text not null default 'pending'
                    check (state in ('pending','in_flight','succeeded','failed')),

  attempts        integer not null default 0,
  max_attempts    integer not null default 12,
  next_attempt_at timestamptz not null default now(),

  -- The canonical serialisation and its hash, retained exactly as signed.
  -- Regenerating it later could produce different bytes, which would make the
  -- signature unverifiable.
  canonical_json  text,
  payload_hash    text,
  signed_payload  text,

  -- Worker lease, so two workers never submit the same document twice.
  locked_at       timestamptz,
  locked_by       text,

  last_error      jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (document_id)
);

create index eta_submission_ready_idx
  on eta_submission (next_attempt_at)
  where state = 'pending';

create trigger eta_submission_touch before update on eta_submission
  for each row execute function app.touch_updated_at();

create table eta_submission_attempt (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references eta_submission(id) on delete cascade,
  attempt_no     integer not null,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  http_status    integer,
  response       jsonb,
  error          text
);

create index eta_attempt_submission_idx on eta_submission_attempt (submission_id);

-- Every posted sales document enters the queue automatically.
create or replace function app.enqueue_for_eta()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'posted'
     and new.doc_type in ('sales_invoice','sales_credit_note','sales_debit_note')
     and (old.status is distinct from 'posted')
  then
    insert into eta_submission (tenant_id, document_id)
    values (new.tenant_id, new.id)
    on conflict (document_id) do nothing;
  end if;
  return null;
end;
$$;

create trigger document_enqueue_eta
  after update on document
  for each row execute function app.enqueue_for_eta();

-- ---------------------------------------------------------------------------
-- Worker interface
-- ---------------------------------------------------------------------------

-- Claims up to p_limit due submissions and leases them. SKIP LOCKED lets
-- several workers run concurrently without contending on the same rows.
create or replace function app.claim_eta_submissions(
  p_worker text, p_limit integer default 10
)
returns setof eta_submission
language plpgsql
as $$
begin
  return query
  update eta_submission s
     set state = 'in_flight',
         attempts = s.attempts + 1,
         locked_at = now(),
         locked_by = p_worker
   where s.id in (
     select id from eta_submission
      where state = 'pending'
        and next_attempt_at <= now()
      order by next_attempt_at
      limit p_limit
      for update skip locked
   )
  returning s.*;
end;
$$;

create or replace function app.complete_eta_submission(
  p_submission_id uuid,
  p_uuid          text,
  p_long_id       text,
  p_response      jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_doc uuid;
begin
  update eta_submission
     set state = 'succeeded', locked_at = null, locked_by = null,
         last_error = null
   where id = p_submission_id
  returning document_id into v_doc;

  if v_doc is null then
    raise exception 'submission % not found', p_submission_id;
  end if;

  insert into eta_submission_attempt
    (submission_id, attempt_no, finished_at, http_status, response)
  select id, attempts, now(), 200, p_response
  from eta_submission where id = p_submission_id;

  -- Permitted on a posted document: only the ETA tracking fields move.
  update document
     set eta_uuid = p_uuid,
         eta_long_id = p_long_id,
         eta_status = 'valid',
         eta_submitted_at = now(),
         eta_error = null
   where id = v_doc;
end;
$$;

-- Records a failure and schedules the retry with exponential backoff,
-- capped at one hour. A permanent rejection stops retrying immediately.
create or replace function app.fail_eta_submission(
  p_submission_id uuid,
  p_error         jsonb,
  p_permanent     boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_sub eta_submission%rowtype;
  v_backoff interval;
begin
  select * into v_sub from eta_submission where id = p_submission_id for update;
  if not found then
    raise exception 'submission % not found', p_submission_id;
  end if;

  insert into eta_submission_attempt
    (submission_id, attempt_no, finished_at, response, error)
  values (p_submission_id, v_sub.attempts, now(), p_error, p_error ->> 'message');

  if p_permanent or v_sub.attempts >= v_sub.max_attempts then
    update eta_submission
       set state = 'failed', last_error = p_error,
           locked_at = null, locked_by = null
     where id = p_submission_id;

    update document
       set eta_status = case when p_permanent then 'rejected' else 'invalid' end,
           eta_error = p_error
     where id = v_sub.document_id;
  else
    v_backoff := least(
      make_interval(secs => power(2, v_sub.attempts)::int * 30),
      interval '1 hour');

    update eta_submission
       set state = 'pending',
           next_attempt_at = now() + v_backoff,
           last_error = p_error,
           locked_at = null, locked_by = null
     where id = p_submission_id;
  end if;
end;
$$;

-- Releases leases held by a worker that died mid-flight.
create or replace function app.reclaim_stale_eta_leases(
  p_older_than interval default interval '10 minutes'
)
returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  update eta_submission
     set state = 'pending', locked_at = null, locked_by = null
   where state = 'in_flight'
     and locked_at < now() - p_older_than;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table audit_log (
  id          bigserial primary key,
  tenant_id   uuid,
  actor_id    uuid,
  action      text not null,
  table_name  text not null,
  row_id      uuid,
  before      jsonb,
  after       jsonb,
  at          timestamptz not null default now()
);

create index audit_log_tenant_idx on audit_log (tenant_id, at desc);
create index audit_log_row_idx    on audit_log (table_name, row_id);

create or replace function app.write_audit()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
begin
  insert into audit_log (tenant_id, actor_id, action, table_name, row_id, before, after)
  values (
    (v_row ->> 'tenant_id')::uuid,
    app.current_user_id(),
    tg_op,
    tg_table_name,
    (v_row ->> 'id')::uuid,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger document_audit
  after insert or update or delete on document
  for each row execute function app.write_audit();

create trigger journal_entry_audit
  after insert on journal_entry
  for each row execute function app.write_audit();

create trigger app_user_audit
  after insert or update or delete on app_user
  for each row execute function app.write_audit();
