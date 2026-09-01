-- =============================================================================
-- Row level security: tenant isolation and the role model
-- =============================================================================
-- RLS is bypassed by superusers, so these run as an unprivileged role that
-- stands in for Supabase's `authenticated`.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_client') then
    create role app_client nologin;
  end if;
end $$;

grant usage on schema public, app to app_client;
grant select, insert, update, delete on all tables in schema public to app_client;
grant execute on all functions in schema app to app_client;
grant usage, select on all sequences in schema public to app_client;

-- A second company, to prove nothing leaks between tenants.
do $$
declare
  v_other_owner uuid := '99999999-9999-9999-9999-999999999999';
  v_other uuid;
  v_branch uuid;
begin
  v_other := app.provision_tenant('Delta Trading', 'دلتا للتجارة', v_other_owner);
  select id into v_branch from branch where tenant_id = v_other;

  insert into party (tenant_id, code, name_ar, party_type, tax_registration_no)
  values (v_other, 'D001', 'عميل دلتا', 'business', '987654321');
end $$;

-- --- tenant isolation --------------------------------------------------------
do $$
declare
  v_a_owner uuid := '11111111-1111-1111-1111-111111111111';
  v_visible int;
begin
  perform tst.act_as(v_a_owner);
  set local role app_client;

  select count(*) into v_visible from party;
  perform tst.eq('rls: a user sees only their own tenant''s parties', v_visible, 1);

  select count(*) into v_visible from tenant;
  perform tst.eq('rls: a user sees exactly one tenant', v_visible, 1);

  select count(*) into v_visible from document
   where tenant_id <> (select app.current_tenant_id());
  perform tst.eq('rls: no cross-tenant documents are visible', v_visible, 0);

  select count(*) into v_visible from journal_line
   where tenant_id <> (select app.current_tenant_id());
  perform tst.eq('rls: no cross-tenant ledger lines are visible', v_visible, 0);

  reset role;
end $$;

-- --- the ledger is not writable from the client ------------------------------
do $$
declare
  v_owner  uuid := '11111111-1111-1111-1111-111111111111';
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_period uuid := (select id from fiscal_period where tenant_id = v_tenant
                    and current_date between starts_on and ends_on);
begin
  perform tst.act_as(v_owner);
  set local role app_client;

  perform tst.raises('rls: even an owner cannot insert into the ledger directly',
    format('insert into journal_entry (tenant_id, fiscal_period_id, entry_no,
             entry_date, posted_by) values (%L, %L, 12345, current_date, %L)',
           v_tenant, v_period, v_owner),
    'row-level security');

  reset role;
end $$;

-- --- role permissions --------------------------------------------------------
do $$
declare
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_branch uuid := (select id from branch where tenant_id = v_tenant);
  v_cust   uuid := (select id from party where tenant_id = v_tenant and code = 'C001');
  v_entry  uuid := '22222222-2222-2222-2222-222222222222';  -- data_entry
  v_view   uuid := '44444444-4444-4444-4444-444444444444';  -- viewer
  v_inv_v  uuid := '55555555-5555-5555-5555-555555555555';  -- invoice_viewer
  v_sup    uuid := '66666666-6666-6666-6666-666666666666';  -- supervisor
  v_n      int;
  v_doc    uuid := (select id from document where tenant_id = v_tenant
                    and status = 'posted' limit 1);
begin
  insert into app_user (id, tenant_id, branch_id, username, full_name, role,
                        is_approved, approved_at)
  values (v_view,  v_tenant, v_branch, 'worker3', 'مطّلِع',      'viewer',        true, now()),
         (v_inv_v, v_tenant, v_branch, 'worker4', 'عرض الفواتير','invoice_viewer',true, now()),
         (v_sup,   v_tenant, v_branch, 'worker0', 'المشرف',      'supervisor',    true, now());

  -- data_entry: may draft, may not post.
  -- An RLS USING clause filters rows on UPDATE rather than raising, so the
  -- assertion is that nothing moved -- not that an error came back.
  perform tst.act_as(v_entry);
  set local role app_client;
  update document set status = 'draft' where id = v_doc;
  perform tst.eq('rls: data entry cannot un-post a posted document',
    (select status from document where id = v_doc),
    'posted'::app.document_status);

  perform tst.raises('rls: data entry cannot hand-post a draft into the ledger',
    format('insert into document (tenant_id, branch_id, doc_type, doc_no,
             party_id, created_by, status)
            values (%L, %L, ''sales_invoice'', ''HACK-1'', %L, %L, ''posted'')',
           v_tenant, v_branch, v_cust, v_entry),
    'row-level security');
  reset role;

  -- viewer: reads parties and the ledger, writes nothing
  perform tst.act_as(v_view);
  set local role app_client;
  select count(*) into v_n from party;
  perform tst.ok('rls: a viewer can read parties', v_n > 0);
  select count(*) into v_n from journal_line;
  perform tst.ok('rls: a viewer can read the ledger', v_n > 0);
  perform tst.raises('rls: a viewer cannot create a party',
    format('insert into party (tenant_id, code, name_ar, party_type,
             tax_registration_no) values (%L, ''X1'', ''تجريبي'', ''business'', ''111222333'')',
           v_tenant),
    'row-level security');
  reset role;

  -- invoice_viewer: documents only, no party list, no ledger
  perform tst.act_as(v_inv_v);
  set local role app_client;
  select count(*) into v_n from party;
  perform tst.eq('rls: invoice viewer cannot list parties', v_n, 0);
  select count(*) into v_n from journal_line;
  perform tst.eq('rls: invoice viewer cannot read the ledger', v_n, 0);
  select count(*) into v_n from document;
  perform tst.ok('rls: invoice viewer can read documents', v_n > 0);
  reset role;

  -- invoice_viewer and viewer may not touch reference data either
  perform tst.act_as(v_view);
  set local role app_client;
  perform tst.raises('rls: a viewer cannot create an account',
    format('insert into account (tenant_id, code, name_ar, type, normal_balance)
            values (%L, ''9999'', ''حساب مزيف'', ''asset'', ''debit'')', v_tenant),
    'row-level security');
  perform tst.raises('rls: a viewer cannot create a tax code',
    format('insert into tax_code (tenant_id, code, name_ar, rate)
            values (%L, ''VAT0X'', ''معدل مزيف'', 0)', v_tenant),
    'row-level security');
  reset role;

  -- supervisor: sees everything, changes nothing
  perform tst.act_as(v_sup);
  set local role app_client;
  select count(*) into v_n from journal_line;
  perform tst.ok('rls: a supervisor can read the ledger', v_n > 0);
  perform tst.raises('rls: a supervisor cannot create a document',
    format('insert into document (tenant_id, branch_id, doc_type, doc_no,
             party_id, created_by) values (%L, %L, ''sales_invoice'', ''SUP-1'', %L, %L)',
           v_tenant, v_branch, v_cust, v_sup),
    'row-level security');
  perform tst.raises('rls: a supervisor cannot create a party',
    format('insert into party (tenant_id, code, name_ar, party_type,
             tax_registration_no) values (%L, ''S1'', ''عميل'', ''business'', ''555666777'')',
           v_tenant),
    'row-level security');
  reset role;

  -- a user cannot plant a row in another tenant
  perform tst.act_as(v_entry);
  set local role app_client;
  perform tst.raises('rls: a user cannot write into another tenant',
    format('insert into party (tenant_id, code, name_ar, party_type,
             tax_registration_no) values (%L, ''X9'', ''تسلل'', ''business'', ''111111111'')',
           (select id from tenant where name = 'Delta Trading')),
    'row-level security');
  reset role;
end $$;

-- --- unapproved and inactive users resolve to no tenant at all ----------------
do $$
declare
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_branch uuid := (select id from branch where tenant_id = v_tenant);
  v_pending uuid := '77777777-7777-7777-7777-777777777777';
  v_n int;
begin
  insert into app_user (id, tenant_id, branch_id, username, full_name, role,
                        is_approved)
  values (v_pending, v_tenant, v_branch, 'newguy', 'موظف جديد', 'data_entry', false);

  perform tst.act_as(v_pending);
  set local role app_client;
  select count(*) into v_n from document;
  perform tst.eq('rls: a login awaiting manager approval sees nothing', v_n, 0);
  reset role;

  update app_user set is_approved = true, is_active = false where id = v_pending;
  perform tst.act_as(v_pending);
  set local role app_client;
  select count(*) into v_n from document;
  perform tst.eq('rls: a deactivated user sees nothing', v_n, 0);
  reset role;
end $$;

-- --- the ETA client secret must never reach a client --------------------------
do $$
declare
  v_owner uuid := '11111111-1111-1111-1111-111111111111';
  v_n int;
begin
  perform tst.act_as(v_owner);
  set local role app_client;
  select count(*) into v_n from tenant_public;
  perform tst.eq('rls: tenant_public exposes the tenant', v_n, 1);
  perform tst.ok('rls: tenant_public omits the ETA secret',
    not exists (
      select 1 from information_schema.columns
      where table_name = 'tenant_public' and column_name = 'eta_client_secret'));
  reset role;
end $$;
