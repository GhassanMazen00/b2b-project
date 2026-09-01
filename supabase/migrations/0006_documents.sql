-- =============================================================================
-- 0006  Commercial documents and the review workflow
-- =============================================================================
-- A document is mutable while it is being prepared and frozen the moment it
-- posts. That single rule satisfies two separate masters: an auditor, who
-- needs history not to move, and the Tax Authority, for whom a cleared
-- invoice is legally immutable and correctable only by a credit note.
--
-- The review workflow carried over from AZ Accounting maps exactly onto this:
-- the reviewer's approval IS the moment of posting.
-- =============================================================================

create table document (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenant(id) on delete cascade,
  branch_id        uuid not null references branch(id),

  doc_type         app.document_type not null,
  doc_no           text not null,
  status           app.document_status not null default 'draft',

  party_id         uuid references party(id) on delete restrict,
  issued_on        date not null default current_date,
  due_on           date,

  currency         char(3) not null default 'EGP',
  fx_rate          numeric(18,8) not null default 1,

  -- Denormalised totals, recomputed by trigger from the lines. Stored because
  -- every list view needs them and recomputing on read does not scale.
  subtotal         numeric(18,5) not null default 0,
  discount_total   numeric(18,5) not null default 0,
  tax_total        numeric(18,5) not null default 0,
  total            numeric(18,5) not null default 0,

  notes            text,

  -- What this document corrects, for credit and debit notes.
  corrects_doc_id  uuid references document(id),

  -- Review workflow
  created_by       uuid not null references app_user(id),
  submitted_at     timestamptz,
  reviewed_by      uuid references app_user(id),
  reviewed_at      timestamptz,
  rejection_reason text,

  -- Ledger link, set at posting
  journal_entry_id uuid references journal_entry(id),
  posted_at        timestamptz,

  -- Cancellation
  cancelled_at     timestamptz,
  cancelled_by     uuid references app_user(id),
  cancel_reason    text,

  -- ETA state. Populated by the submission worker in 0008.
  eta_uuid         text,
  eta_long_id      text,
  eta_submission_uuid text,
  eta_status       text not null default 'not_submitted'
                     check (eta_status in ('not_submitted','queued','submitted',
                                           'valid','invalid','rejected','cancelled')),
  eta_submitted_at timestamptz,
  eta_error        jsonb,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (tenant_id, doc_type, doc_no),
  constraint document_fx_positive check (fx_rate > 0),
  constraint document_posted_has_entry
    check (status <> 'posted' or journal_entry_id is not null),
  constraint document_rejected_has_reason
    check (status <> 'rejected' or rejection_reason is not null),
  constraint document_credit_note_corrects
    check (doc_type not in ('sales_credit_note','sales_debit_note')
           or corrects_doc_id is not null)
);

create index document_tenant_status_idx on document (tenant_id, status, issued_on desc);
create index document_party_idx         on document (tenant_id, party_id);
create index document_review_queue_idx  on document (tenant_id, submitted_at)
  where status = 'pending_review';
create index document_eta_pending_idx   on document (tenant_id, eta_status)
  where eta_status in ('queued','submitted');

create table document_line (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references document(id) on delete cascade,
  tenant_id     uuid not null references tenant(id) on delete cascade,
  line_no       integer not null,

  item_id       uuid references item(id) on delete restrict,
  -- Copied from the item at entry time. The catalogue may change later; what
  -- was invoiced must not.
  description   text not null,
  item_code_type text,
  item_code     text,
  uom_code      text,

  quantity      numeric(18,5) not null,
  unit_price    numeric(18,5) not null,
  discount      numeric(18,5) not null default 0,

  tax_code_id   uuid references tax_code(id),
  tax_rate      numeric(7,4) not null default 0,
  tax_amount    numeric(18,5) not null default 0,

  line_total    numeric(18,5) not null default 0,

  unique (document_id, line_no),
  constraint document_line_qty_positive   check (quantity > 0),
  constraint document_line_price_positive check (unit_price >= 0),
  constraint document_line_discount_sane
    check (discount >= 0 and discount <= quantity * unit_price)
);

create index document_line_doc_idx on document_line (document_id);

-- ---------------------------------------------------------------------------
-- Freeze rule
-- ---------------------------------------------------------------------------

create or replace function app.assert_document_mutable()
returns trigger
language plpgsql
as $$
declare
  v_editable constant app.document_status[] :=
    array['draft','pending_review','rejected']::app.document_status[];
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception
        'document % is %; only a draft may be deleted', old.doc_no, old.status
        using errcode = 'restrict_violation';
    end if;
    return old;
  end if;

  -- Leaving a frozen state is only ever allowed along sanctioned transitions.
  if old.status = any(array['posted','cancelled']::app.document_status[]) then
    if old.status = 'posted' and new.status = 'cancelled' then
      null;  -- posted -> cancelled is the one permitted move
    elsif old.status = new.status then
      -- Same state: only ETA tracking fields may move, since clearance happens
      -- asynchronously and long after posting.
      if (new.id, new.doc_type, new.doc_no, new.party_id, new.issued_on,
          new.subtotal, new.discount_total, new.tax_total, new.total,
          new.journal_entry_id, new.branch_id, new.currency, new.fx_rate)
         is distinct from
         (old.id, old.doc_type, old.doc_no, old.party_id, old.issued_on,
          old.subtotal, old.discount_total, old.tax_total, old.total,
          old.journal_entry_id, old.branch_id, old.currency, old.fx_rate)
      then
        raise exception
          'document % is % and cannot be edited. Issue a credit note instead.',
          old.doc_no, old.status
          using errcode = 'restrict_violation';
      end if;
    else
      raise exception
        'document % cannot move from % to %', old.doc_no, old.status, new.status
        using errcode = 'restrict_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger document_freeze
  before update or delete on document
  for each row execute function app.assert_document_mutable();

-- Lines follow their parent's state.
create or replace function app.assert_line_mutable()
returns trigger
language plpgsql
as $$
declare
  v_status app.document_status;
  v_doc    uuid := coalesce(new.document_id, old.document_id);
begin
  select status into v_status from document where id = v_doc;

  -- Parent already gone (ON DELETE CASCADE); nothing to guard.
  if not found then
    return coalesce(new, old);
  end if;

  if v_status not in ('draft','pending_review','rejected') then
    raise exception
      'cannot modify lines of a % document', v_status
      using errcode = 'restrict_violation';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger document_line_freeze
  before insert or update or delete on document_line
  for each row execute function app.assert_line_mutable();

-- ---------------------------------------------------------------------------
-- Line arithmetic and document totals, computed in the database so that every
-- client agrees on the numbers.
-- ---------------------------------------------------------------------------

create or replace function app.compute_line_amounts()
returns trigger
language plpgsql
as $$
declare
  v_net numeric(18,5);
begin
  if new.tax_code_id is not null and new.tax_rate = 0 then
    select rate into new.tax_rate from tax_code where id = new.tax_code_id;
  end if;

  v_net := app.round5(new.quantity * new.unit_price - new.discount);
  new.tax_amount := app.round5(v_net * new.tax_rate / 100);
  new.line_total := app.round5(v_net + new.tax_amount);
  return new;
end;
$$;

create trigger document_line_amounts
  before insert or update on document_line
  for each row execute function app.compute_line_amounts();

create or replace function app.recompute_document_totals()
returns trigger
language plpgsql
as $$
declare
  v_doc uuid := coalesce(new.document_id, old.document_id);
begin
  update document d
     set subtotal       = t.subtotal,
         discount_total = t.discount_total,
         tax_total      = t.tax_total,
         total          = t.total
    from (
      select
        app.round5(coalesce(sum(quantity * unit_price), 0))        as subtotal,
        app.round5(coalesce(sum(discount), 0))                     as discount_total,
        app.round5(coalesce(sum(tax_amount), 0))                   as tax_total,
        app.round5(coalesce(sum(line_total), 0))                   as total
      from document_line where document_id = v_doc
    ) t
   where d.id = v_doc;

  return null;
end;
$$;

create trigger document_line_totals
  after insert or update or delete on document_line
  for each row execute function app.recompute_document_totals();
