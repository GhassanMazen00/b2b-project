-- =============================================================================
-- 0010  Reporting views
-- =============================================================================
-- security_invoker means these read through the caller's RLS policies rather
-- than the view owner's, so a viewer cannot use a report to see another
-- tenant's numbers.
-- =============================================================================

-- Every posted movement, flattened. The base for most reports.
create view ledger_movement
with (security_invoker = true)
as
select
  jl.id            as line_id,
  je.tenant_id,
  je.branch_id,
  je.id            as entry_id,
  je.entry_no,
  je.entry_date,
  je.fiscal_period_id,
  je.source_doc_type,
  je.source_doc_id,
  je.reverses_entry_id is not null as is_reversal,
  a.id             as account_id,
  a.code           as account_code,
  a.name_ar        as account_name,
  a.type           as account_type,
  jl.party_id,
  p.name_ar        as party_name,
  jl.debit,
  jl.credit,
  jl.debit - jl.credit as signed_amount,
  jl.currency,
  jl.memo
from journal_line jl
join journal_entry je on je.id = jl.entry_id
join account a        on a.id = jl.account_id
left join party p     on p.id = jl.party_id;

-- Trial balance. Should always net to zero per tenant; if it does not, the
-- balance constraint in 0004 has been bypassed somehow.
create view trial_balance
with (security_invoker = true)
as
select
  a.tenant_id,
  a.id      as account_id,
  a.code    as account_code,
  a.name_ar as account_name,
  a.type    as account_type,
  coalesce(sum(jl.debit), 0)  as total_debit,
  coalesce(sum(jl.credit), 0) as total_credit,
  case a.normal_balance
    when 'debit'  then coalesce(sum(jl.debit - jl.credit), 0)
    else               coalesce(sum(jl.credit - jl.debit), 0)
  end as balance
from account a
left join journal_line jl on jl.account_id = a.id
where a.is_postable
group by a.tenant_id, a.id, a.code, a.name_ar, a.type, a.normal_balance;

-- Customer / supplier statement -- كشف حساب.
-- This is the report AZ Accounting was built around, now derived from the
-- ledger rather than stored separately.
create view party_statement
with (security_invoker = true)
as
select
  jl.tenant_id,
  jl.party_id,
  je.entry_date,
  je.entry_no,
  je.source_doc_type,
  d.doc_no,
  jl.memo,
  jl.debit,
  jl.credit,
  sum(jl.debit - jl.credit) over (
    partition by jl.tenant_id, jl.party_id
    order by je.entry_date, je.entry_no, jl.line_no
    rows between unbounded preceding and current row
  ) as running_balance
from journal_line jl
join journal_entry je on je.id = jl.entry_id
left join document d  on d.id = je.source_doc_id
where jl.party_id is not null;

create view party_balance
with (security_invoker = true)
as
select
  p.tenant_id,
  p.id   as party_id,
  p.code,
  p.name_ar,
  p.is_customer,
  p.is_supplier,
  coalesce(sum(jl.debit - jl.credit), 0) as balance,
  p.credit_limit,
  p.credit_limit is not null
    and coalesce(sum(jl.debit - jl.credit), 0) > p.credit_limit as over_limit
from party p
left join journal_line jl on jl.party_id = p.id
group by p.tenant_id, p.id, p.code, p.name_ar, p.is_customer,
         p.is_supplier, p.credit_limit;

-- Receivables ageing -- أعمار الديون.
create view receivable_ageing
with (security_invoker = true)
as
with open_invoices as (
  select
    d.tenant_id, d.party_id, d.id, d.doc_no, d.issued_on,
    coalesce(d.due_on, d.issued_on) as due_on,
    d.total - coalesce((
      select sum(s.amount) from settlement s where s.invoice_id = d.id
    ), 0) as outstanding
  from document d
  where d.doc_type = 'sales_invoice'
    and d.status = 'posted'
)
select
  oi.tenant_id,
  oi.party_id,
  p.name_ar as party_name,
  oi.id as document_id,
  oi.doc_no,
  oi.issued_on,
  oi.due_on,
  oi.outstanding,
  (current_date - oi.due_on) as days_overdue,
  case
    when current_date <= oi.due_on                 then 'current'
    when current_date - oi.due_on <= 30            then '1-30'
    when current_date - oi.due_on <= 60            then '31-60'
    when current_date - oi.due_on <= 90            then '61-90'
    else                                                '90+'
  end as bucket
from open_invoices oi
join party p on p.id = oi.party_id
where oi.outstanding > 0;

-- What the reviewer sees when they open their queue.
create view review_queue
with (security_invoker = true)
as
select
  d.tenant_id, d.id, d.doc_type, d.doc_no, d.issued_on, d.total, d.currency,
  d.submitted_at,
  p.name_ar  as party_name,
  u.full_name as created_by_name,
  (select count(*) from document_line dl where dl.document_id = d.id) as line_count
from document d
left join party p    on p.id = d.party_id
join app_user u      on u.id = d.created_by
where d.status = 'pending_review';

-- Operational health of the ETA queue.
create view eta_queue_status
with (security_invoker = true)
as
select
  s.tenant_id,
  s.state,
  count(*)                                          as documents,
  min(s.next_attempt_at) filter (where s.state = 'pending') as next_due,
  sum(d.total)                                      as total_value,
  max(s.attempts)                                   as worst_attempts
from eta_submission s
join document d on d.id = s.document_id
group by s.tenant_id, s.state;
