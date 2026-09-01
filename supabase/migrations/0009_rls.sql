-- =============================================================================
-- 0009  Row level security
-- =============================================================================
-- Two things are enforced here:
--   1. Tenant isolation. No row ever crosses a tenant boundary.
--   2. The six-role permission model carried over from AZ Accounting.
--
-- Policy predicates wrap helper calls in a scalar subquery -- (select app.x())
-- -- so the planner evaluates them once per statement rather than once per row.
-- =============================================================================

alter table tenant           enable row level security;
alter table branch           enable row level security;
alter table app_user         enable row level security;
alter table account          enable row level security;
alter table account_default  enable row level security;
alter table fiscal_year      enable row level security;
alter table fiscal_period    enable row level security;
alter table journal_entry    enable row level security;
alter table journal_line     enable row level security;
alter table number_series    enable row level security;
alter table party            enable row level security;
alter table uom              enable row level security;
alter table item             enable row level security;
alter table tax_code         enable row level security;
alter table document         enable row level security;
alter table document_line    enable row level security;
alter table settlement       enable row level security;
alter table eta_submission   enable row level security;
alter table eta_submission_attempt enable row level security;
alter table audit_log        enable row level security;

-- ---------------------------------------------------------------------------
-- Tenant, branches, users
-- ---------------------------------------------------------------------------

create policy tenant_read on tenant for select
  using (id = (select app.current_tenant_id()));

create policy tenant_write on tenant for update
  using (id = (select app.current_tenant_id()) and (select app.has_role('owner')))
  with check (id = (select app.current_tenant_id())
              and (select app.has_role('owner')));

create policy branch_read on branch for select
  using (tenant_id = (select app.current_tenant_id()));

create policy branch_write on branch for all
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager')))
  with check (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager')));

-- Everyone can see who their colleagues are; only owners and managers
-- create users or approve their logins.
create policy app_user_read on app_user for select
  using (tenant_id = (select app.current_tenant_id()));

create policy app_user_write on app_user for all
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager')))
  with check (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager')));

-- ---------------------------------------------------------------------------
-- Reference data: readable by all staff, maintained by owner/manager
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['account','uom','item','tax_code','account_default'] loop
    execute format($f$
      create policy %1$s_read on %1$s for select
        using (tenant_id = (select app.current_tenant_id()));
      create policy %1$s_write on %1$s for all
        using (tenant_id = (select app.current_tenant_id())
               and (select app.has_role('owner','manager')))
        with check (tenant_id = (select app.current_tenant_id())
               and (select app.has_role('owner','manager')));
    $f$, t);
  end loop;
end $$;

create policy fiscal_year_read on fiscal_year for select
  using (tenant_id = (select app.current_tenant_id()));
create policy fiscal_year_write on fiscal_year for all
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager')))
  with check (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager')));

create policy fiscal_period_read on fiscal_period for select
  using (tenant_id = (select app.current_tenant_id()));
create policy fiscal_period_write on fiscal_period for all
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager')))
  with check (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager')));

create policy number_series_rw on number_series for all
  using (tenant_id = (select app.current_tenant_id()))
  with check (tenant_id = (select app.current_tenant_id()));

-- ---------------------------------------------------------------------------
-- Parties
-- ---------------------------------------------------------------------------
-- invoice_viewer is deliberately excluded: that role sees documents only.

create policy party_read on party for select
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager','supervisor',
                                  'data_entry','reviewer','viewer')));

create policy party_write on party for all
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager','data_entry')))
  with check (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager','data_entry')));

-- ---------------------------------------------------------------------------
-- The ledger is read-only to everyone. It is written only through
-- SECURITY DEFINER functions, which is the whole point of the design.
-- ---------------------------------------------------------------------------

create policy journal_entry_read on journal_entry for select
  using (tenant_id = (select app.current_tenant_id())
         and (select app.can_read_ledger()));

create policy journal_line_read on journal_line for select
  using (tenant_id = (select app.current_tenant_id())
         and (select app.can_read_ledger()));

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create policy document_read on document for select
  using (tenant_id = (select app.current_tenant_id()));

-- Data entry may create drafts and edit only their own unposted work.
create policy document_insert on document for insert
  with check (
    tenant_id = (select app.current_tenant_id())
    and (select app.has_role('owner','manager','data_entry'))
    and status = 'draft'
  );

create policy document_update on document for update
  using (
    tenant_id = (select app.current_tenant_id())
    and status in ('draft','pending_review','rejected')
    and (
      (select app.has_role('owner','manager','reviewer'))
      or ((select app.has_role('data_entry')) and created_by = (select app.current_user_id()))
    )
  )
  with check (
    tenant_id = (select app.current_tenant_id())
    -- A client may never move a document into the ledger by hand; posting
    -- happens only through app.approve_document().
    and status in ('draft','pending_review','rejected')
  );

create policy document_delete on document for delete
  using (
    tenant_id = (select app.current_tenant_id())
    and status = 'draft'
    and (
      (select app.has_role('owner','manager'))
      or ((select app.has_role('data_entry')) and created_by = (select app.current_user_id()))
    )
  );

create policy document_line_read on document_line for select
  using (tenant_id = (select app.current_tenant_id()));

create policy document_line_write on document_line for all
  using (
    tenant_id = (select app.current_tenant_id())
    and exists (
      select 1 from document d
      where d.id = document_line.document_id
        and d.status in ('draft','pending_review','rejected')
        and (
          (select app.has_role('owner','manager','reviewer'))
          or ((select app.has_role('data_entry')) and d.created_by = (select app.current_user_id()))
        )
    )
  )
  with check (
    tenant_id = (select app.current_tenant_id())
    and exists (
      select 1 from document d
      where d.id = document_line.document_id
        and d.status in ('draft','pending_review','rejected')
        and (
          (select app.has_role('owner','manager','reviewer'))
          or ((select app.has_role('data_entry')) and d.created_by = (select app.current_user_id()))
        )
    )
  );

create policy settlement_read on settlement for select
  using (tenant_id = (select app.current_tenant_id())
         and (select app.can_read_ledger()));

create policy settlement_write on settlement for all
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager','data_entry')))
  with check (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager','data_entry')));

-- ---------------------------------------------------------------------------
-- ETA queue and audit: visible to management, written by the worker
-- ---------------------------------------------------------------------------

create policy eta_submission_read on eta_submission for select
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager','supervisor','reviewer')));

create policy eta_attempt_read on eta_submission_attempt for select
  using (exists (
    select 1 from eta_submission s
    where s.id = eta_submission_attempt.submission_id
      and s.tenant_id = (select app.current_tenant_id())
      and (select app.has_role('owner','manager','supervisor','reviewer'))
  ));

create policy audit_log_read on audit_log for select
  using (tenant_id = (select app.current_tenant_id())
         and (select app.has_role('owner','manager','supervisor')));

-- ---------------------------------------------------------------------------
-- tenant.eta_client_secret must never leave the server. No policy grants
-- column access, so expose tenants to clients through this view instead.
-- ---------------------------------------------------------------------------

create view tenant_public
with (security_invoker = true)
as
  select id, name, legal_name_ar, legal_name_en, tax_registration_no,
         commercial_reg_no, eta_environment, base_currency, vat_registered,
         created_at, updated_at
  from tenant;
