-- =============================================================================
-- 0007  Posting: turning an approved document into ledger entries
-- =============================================================================

-- Which account each kind of posting lands in, per tenant.
create table account_default (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  purpose    text not null check (purpose in (
               'receivable','payable','sales_revenue','purchases',
               'vat_output','vat_input','cash','bank',
               'discount_allowed','withholding_receivable','rounding')),
  account_id uuid not null references account(id) on delete restrict,
  primary key (tenant_id, purpose)
);

create or replace function app.default_account(p_tenant uuid, p_purpose text)
returns uuid
language plpgsql
stable
as $$
declare
  v_id uuid;
begin
  select account_id into v_id
  from account_default
  where tenant_id = p_tenant and purpose = p_purpose;

  if v_id is null then
    raise exception 'no default account configured for "%"', p_purpose
      using errcode = 'check_violation',
            hint = 'Set it in account_default before posting.';
  end if;
  return v_id;
end;
$$;

-- Settlement: which receipt paid which invoice, and how much of it.
create table settlement (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenant(id) on delete cascade,
  receipt_id    uuid not null references document(id) on delete cascade,
  invoice_id    uuid not null references document(id) on delete restrict,
  amount        numeric(18,5) not null,
  created_at    timestamptz not null default now(),

  unique (receipt_id, invoice_id),
  constraint settlement_amount_positive check (amount > 0)
);

create index settlement_invoice_idx on settlement (invoice_id);

-- ---------------------------------------------------------------------------
-- The posting rules, one branch per document type.
-- ---------------------------------------------------------------------------

create or replace function app.post_document(p_doc_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_doc     document%rowtype;
  v_entry   uuid;
  v_period  uuid;
  v_line_no integer := 0;
  v_actor   uuid := app.current_user_id();
  v_sign    integer;
  r         record;
begin
  select * into v_doc from document where id = p_doc_id for update;
  if not found then
    raise exception 'document % not found', p_doc_id;
  end if;

  if v_doc.status = 'posted' then
    raise exception 'document % is already posted', v_doc.doc_no
      using errcode = 'restrict_violation';
  end if;

  if not exists (select 1 from document_line where document_id = p_doc_id) then
    raise exception 'document % has no lines', v_doc.doc_no
      using errcode = 'check_violation';
  end if;

  v_period := app.open_period_for(v_doc.tenant_id, v_doc.issued_on);

  insert into journal_entry (
    tenant_id, branch_id, fiscal_period_id, entry_no, entry_date,
    memo_ar, source_doc_type, source_doc_id, posted_by, approved_by
  ) values (
    v_doc.tenant_id, v_doc.branch_id, v_period,
    app.next_number(v_doc.tenant_id, 'journal',
                    extract(year from v_doc.issued_on)::int),
    v_doc.issued_on,
    v_doc.doc_type::text || ' ' || v_doc.doc_no,
    v_doc.doc_type, v_doc.id,
    coalesce(v_doc.created_by, v_actor),
    coalesce(v_actor, v_doc.reviewed_by)
  ) returning id into v_entry;

  -- A credit note is a sales invoice with every sign flipped.
  v_sign := case when v_doc.doc_type = 'sales_credit_note' then -1 else 1 end;

  -- === Sales: invoice, credit note, debit note ==============================
  if v_doc.doc_type in ('sales_invoice','sales_credit_note','sales_debit_note') then

    -- Receivable takes the gross, on the customer's control account.
    v_line_no := v_line_no + 1;
    insert into journal_line (
      entry_id, tenant_id, line_no, account_id, party_id, branch_id,
      debit, credit, currency, fx_rate, memo
    ) values (
      v_entry, v_doc.tenant_id, v_line_no,
      coalesce(
        (select receivable_account_id from party where id = v_doc.party_id),
        app.default_account(v_doc.tenant_id, 'receivable')),
      v_doc.party_id, v_doc.branch_id,
      case when v_sign > 0 then app.round5(v_doc.total) else 0 end,
      case when v_sign < 0 then app.round5(v_doc.total) else 0 end,
      v_doc.currency, v_doc.fx_rate, v_doc.doc_no
    );

    -- Revenue, grouped by the account each item maps to.
    for r in
      select
        coalesce(i.sales_account_id,
                 app.default_account(v_doc.tenant_id, 'sales_revenue')) as account_id,
        app.round5(sum(dl.quantity * dl.unit_price - dl.discount))       as net
      from document_line dl
      left join item i on i.id = dl.item_id
      where dl.document_id = p_doc_id
      group by 1
      having app.round5(sum(dl.quantity * dl.unit_price - dl.discount)) <> 0
    loop
      v_line_no := v_line_no + 1;
      insert into journal_line (
        entry_id, tenant_id, line_no, account_id, branch_id,
        debit, credit, currency, fx_rate
      ) values (
        v_entry, v_doc.tenant_id, v_line_no, r.account_id, v_doc.branch_id,
        case when v_sign < 0 then r.net else 0 end,
        case when v_sign > 0 then r.net else 0 end,
        v_doc.currency, v_doc.fx_rate
      );
    end loop;

    -- Output VAT, grouped by tax code so each rate keeps its own account.
    for r in
      select
        coalesce(tc.output_account_id,
                 app.default_account(v_doc.tenant_id, 'vat_output')) as account_id,
        app.round5(sum(dl.tax_amount))                               as tax
      from document_line dl
      left join tax_code tc on tc.id = dl.tax_code_id
      where dl.document_id = p_doc_id
      group by 1
      having app.round5(sum(dl.tax_amount)) <> 0
    loop
      v_line_no := v_line_no + 1;
      insert into journal_line (
        entry_id, tenant_id, line_no, account_id, branch_id,
        debit, credit, currency, fx_rate, memo
      ) values (
        v_entry, v_doc.tenant_id, v_line_no, r.account_id, v_doc.branch_id,
        case when v_sign < 0 then r.tax else 0 end,
        case when v_sign > 0 then r.tax else 0 end,
        v_doc.currency, v_doc.fx_rate, 'ضريبة القيمة المضافة'
      );
    end loop;

  -- === Purchases ============================================================
  elsif v_doc.doc_type = 'purchase_invoice' then

    for r in
      select
        coalesce(i.purchase_account_id,
                 app.default_account(v_doc.tenant_id, 'purchases')) as account_id,
        app.round5(sum(dl.quantity * dl.unit_price - dl.discount))  as net
      from document_line dl
      left join item i on i.id = dl.item_id
      where dl.document_id = p_doc_id
      group by 1
      having app.round5(sum(dl.quantity * dl.unit_price - dl.discount)) <> 0
    loop
      v_line_no := v_line_no + 1;
      insert into journal_line (
        entry_id, tenant_id, line_no, account_id, branch_id,
        debit, credit, currency, fx_rate
      ) values (
        v_entry, v_doc.tenant_id, v_line_no, r.account_id, v_doc.branch_id,
        r.net, 0, v_doc.currency, v_doc.fx_rate
      );
    end loop;

    if app.round5(v_doc.tax_total) <> 0 then
      v_line_no := v_line_no + 1;
      insert into journal_line (
        entry_id, tenant_id, line_no, account_id, branch_id,
        debit, credit, currency, fx_rate, memo
      ) values (
        v_entry, v_doc.tenant_id, v_line_no,
        app.default_account(v_doc.tenant_id, 'vat_input'), v_doc.branch_id,
        app.round5(v_doc.tax_total), 0, v_doc.currency, v_doc.fx_rate,
        'ضريبة مدخلات'
      );
    end if;

    v_line_no := v_line_no + 1;
    insert into journal_line (
      entry_id, tenant_id, line_no, account_id, party_id, branch_id,
      debit, credit, currency, fx_rate, memo
    ) values (
      v_entry, v_doc.tenant_id, v_line_no,
      coalesce((select payable_account_id from party where id = v_doc.party_id),
               app.default_account(v_doc.tenant_id, 'payable')),
      v_doc.party_id, v_doc.branch_id,
      0, app.round5(v_doc.total), v_doc.currency, v_doc.fx_rate, v_doc.doc_no
    );

  -- === Cash in and out ======================================================
  elsif v_doc.doc_type in ('receipt','payment') then
    declare
      v_cash  uuid := app.default_account(v_doc.tenant_id, 'cash');
      v_ctrl  uuid;
      v_in    boolean := (v_doc.doc_type = 'receipt');
    begin
      v_ctrl := case
        when v_in then coalesce(
               (select receivable_account_id from party where id = v_doc.party_id),
               app.default_account(v_doc.tenant_id, 'receivable'))
        else coalesce(
               (select payable_account_id from party where id = v_doc.party_id),
               app.default_account(v_doc.tenant_id, 'payable'))
      end;

      insert into journal_line (
        entry_id, tenant_id, line_no, account_id, branch_id,
        debit, credit, currency, fx_rate, memo
      ) values (
        v_entry, v_doc.tenant_id, 1, v_cash, v_doc.branch_id,
        case when v_in then app.round5(v_doc.total) else 0 end,
        case when v_in then 0 else app.round5(v_doc.total) end,
        v_doc.currency, v_doc.fx_rate, v_doc.doc_no
      );

      insert into journal_line (
        entry_id, tenant_id, line_no, account_id, party_id, branch_id,
        debit, credit, currency, fx_rate, memo
      ) values (
        v_entry, v_doc.tenant_id, 2, v_ctrl, v_doc.party_id, v_doc.branch_id,
        case when v_in then 0 else app.round5(v_doc.total) end,
        case when v_in then app.round5(v_doc.total) else 0 end,
        v_doc.currency, v_doc.fx_rate, v_doc.doc_no
      );
    end;

  else
    raise exception 'no posting rule for document type %', v_doc.doc_type;
  end if;

  update document
     set status = 'posted',
         journal_entry_id = v_entry,
         posted_at = now(),
         eta_status = case
           when doc_type in ('sales_invoice','sales_credit_note','sales_debit_note')
             then 'queued' else eta_status end
   where id = p_doc_id;

  return v_entry;
end;
$$;

-- ---------------------------------------------------------------------------
-- Workflow transitions. These are the only supported way to move a document.
-- ---------------------------------------------------------------------------

create or replace function app.submit_document(p_doc_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_status app.document_status;
begin
  select status into v_status from document where id = p_doc_id for update;
  if v_status not in ('draft','rejected') then
    raise exception 'only a draft or rejected document may be submitted (is %)',
      v_status using errcode = 'restrict_violation';
  end if;

  update document
     set status = 'pending_review',
         submitted_at = now(),
         rejection_reason = null
   where id = p_doc_id;
end;
$$;

create or replace function app.approve_document(p_doc_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_doc    document%rowtype;
  v_actor  uuid := app.current_user_id();
begin
  select * into v_doc from document where id = p_doc_id for update;

  if v_doc.status <> 'pending_review' then
    raise exception 'document % is not awaiting review (is %)',
      v_doc.doc_no, v_doc.status using errcode = 'restrict_violation';
  end if;

  -- Four eyes: whoever prepared it cannot be the one who approves it.
  if v_actor is not null and v_actor = v_doc.created_by
     and not app.has_role('owner') then
    raise exception 'a document cannot be approved by the user who created it'
      using errcode = 'restrict_violation',
            hint = 'Another reviewer must approve this document.';
  end if;

  update document
     set reviewed_by = v_actor, reviewed_at = now()
   where id = p_doc_id;

  return app.post_document(p_doc_id);
end;
$$;

create or replace function app.reject_document(p_doc_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'a rejection reason is required'
      using errcode = 'check_violation';
  end if;

  update document
     set status = 'rejected',
         rejection_reason = p_reason,
         reviewed_by = app.current_user_id(),
         reviewed_at = now()
   where id = p_doc_id and status = 'pending_review';

  if not found then
    raise exception 'document % is not awaiting review', p_doc_id
      using errcode = 'restrict_violation';
  end if;
end;
$$;

create or replace function app.cancel_document(p_doc_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_doc      document%rowtype;
  v_reversal uuid;
begin
  select * into v_doc from document where id = p_doc_id for update;

  if v_doc.status <> 'posted' then
    raise exception 'only a posted document may be cancelled (is %)', v_doc.status
      using errcode = 'restrict_violation';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception 'a cancellation reason is required'
      using errcode = 'check_violation';
  end if;

  -- Cleared by the authority: cancellation is no longer ours to make.
  if v_doc.eta_status = 'valid' then
    raise exception
      'document % has been cleared by the Tax Authority and cannot be cancelled',
      v_doc.doc_no
      using errcode = 'restrict_violation',
            hint = 'Issue a credit note (إشعار دائن) instead.';
  end if;

  v_reversal := app.reverse_entry(
    v_doc.journal_entry_id, current_date,
    'إلغاء ' || v_doc.doc_no || ' - ' || p_reason);

  update document
     set status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = app.current_user_id(),
         cancel_reason = p_reason
   where id = p_doc_id;

  return v_reversal;
end;
$$;
