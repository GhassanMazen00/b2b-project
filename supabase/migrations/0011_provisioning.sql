-- =============================================================================
-- 0011  Tenant provisioning
-- =============================================================================
-- Creates a working company in one call: chart of accounts, tax codes, units,
-- default account mappings, a branch, and a fiscal year with twelve periods.
-- A new customer should never face an empty chart of accounts.
-- =============================================================================

create or replace function app.provision_tenant(
  p_name            text,
  p_legal_name_ar   text,
  p_owner_user_id   uuid,
  p_owner_username  text default 'manager',
  p_owner_full_name text default 'المدير',
  p_year            integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_tenant uuid;
  v_branch uuid;
  v_year   integer := coalesce(p_year, extract(year from current_date)::int);
  v_fy     uuid;
  m        integer;
  rec      record;
  v_acc    uuid;

  -- code, name_ar, name_en, type, normal_balance, parent_code, postable
  accounts constant text[][] := array[
    -- === الأصول =============================================================
    ['1000','الأصول','Assets','asset','debit','','f'],
    ['1100','الأصول المتداولة','Current Assets','asset','debit','1000','f'],
    ['1110','الصندوق','Cash on Hand','asset','debit','1100','t'],
    ['1120','البنك','Bank','asset','debit','1100','t'],
    ['1130','العملاء','Accounts Receivable','asset','debit','1100','t'],
    ['1140','أوراق القبض','Notes Receivable','asset','debit','1100','t'],
    ['1150','المخزون','Inventory','asset','debit','1100','t'],
    ['1160','ضريبة القيمة المضافة - مدخلات','Input VAT','asset','debit','1100','t'],
    ['1170','ضريبة مستقطعة تحت الحساب','Withholding Tax Receivable','asset','debit','1100','t'],
    ['1180','مصروفات مدفوعة مقدماً','Prepaid Expenses','asset','debit','1100','t'],
    ['1200','الأصول الثابتة','Fixed Assets','asset','debit','1000','f'],
    ['1210','أثاث ومعدات','Furniture and Equipment','asset','debit','1200','t'],
    ['1220','مجمع الإهلاك','Accumulated Depreciation','asset','credit','1200','t'],

    -- === الخصوم =============================================================
    ['2000','الخصوم','Liabilities','liability','credit','','f'],
    ['2100','الخصوم المتداولة','Current Liabilities','liability','credit','2000','f'],
    ['2110','الموردون','Accounts Payable','liability','credit','2100','t'],
    ['2120','أوراق الدفع','Notes Payable','liability','credit','2100','t'],
    ['2130','ضريبة القيمة المضافة - مخرجات','Output VAT','liability','credit','2100','t'],
    ['2140','التأمينات الاجتماعية','Social Insurance Payable','liability','credit','2100','t'],
    ['2150','ضريبة كسب العمل','Payroll Tax Payable','liability','credit','2100','t'],
    ['2160','مصروفات مستحقة','Accrued Expenses','liability','credit','2100','t'],

    -- === حقوق الملكية ========================================================
    ['3000','حقوق الملكية','Equity','equity','credit','','f'],
    ['3100','رأس المال','Capital','equity','credit','3000','t'],
    ['3200','الأرباح المحتجزة','Retained Earnings','equity','credit','3000','t'],
    ['3300','المسحوبات','Drawings','equity','debit','3000','t'],

    -- === الإيرادات ==========================================================
    ['4000','الإيرادات','Revenue','revenue','credit','','f'],
    ['4100','إيرادات المبيعات','Sales Revenue','revenue','credit','4000','t'],
    ['4200','مردودات المبيعات','Sales Returns','revenue','debit','4000','t'],
    ['4300','خصم مسموح به','Discounts Allowed','revenue','debit','4000','t'],
    ['4900','إيرادات أخرى','Other Income','revenue','credit','4000','t'],

    -- === المصروفات ==========================================================
    ['5000','المصروفات','Expenses','expense','debit','','f'],
    ['5100','تكلفة المبيعات','Cost of Sales','expense','debit','5000','t'],
    ['5200','المشتريات','Purchases','expense','debit','5000','t'],
    ['5300','الأجور والمرتبات','Salaries and Wages','expense','debit','5000','t'],
    ['5400','الإيجار','Rent','expense','debit','5000','t'],
    ['5500','الكهرباء والمياه','Utilities','expense','debit','5000','t'],
    ['5600','مصروفات نقل وشحن','Freight and Transport','expense','debit','5000','t'],
    ['5700','مصروفات بنكية','Bank Charges','expense','debit','5000','t'],
    ['5800','الإهلاك','Depreciation','expense','debit','5000','t'],
    ['5900','مصروفات متنوعة','Miscellaneous','expense','debit','5000','t'],
    ['5950','فروق عملة','FX Differences','expense','debit','5000','t']
  ];
begin
  insert into tenant (name, legal_name_ar, vat_registered)
  values (p_name, p_legal_name_ar, true)
  returning id into v_tenant;

  insert into branch (tenant_id, code, name, governorate, city)
  values (v_tenant, 'MAIN', 'الفرع الرئيسي', 'القاهرة', 'القاهرة')
  returning id into v_branch;

  insert into app_user (id, tenant_id, branch_id, username, full_name,
                        role, is_approved, approved_at)
  values (p_owner_user_id, v_tenant, v_branch, p_owner_username,
          p_owner_full_name, 'owner', true, now());

  -- Chart of accounts, parents before children.
  for i in 1 .. array_length(accounts, 1) loop
    insert into account (tenant_id, parent_id, code, name_ar, name_en,
                         type, normal_balance, is_postable)
    values (
      v_tenant,
      case when accounts[i][6] <> '' then
        (select id from account
          where tenant_id = v_tenant and code = accounts[i][6])
      end,
      accounts[i][1], accounts[i][2], accounts[i][3],
      accounts[i][4]::app.account_type,
      accounts[i][5]::app.normal_balance,
      accounts[i][7]::boolean
    );
  end loop;

  -- Egyptian VAT codes. eta_subtype values are the authority's own code table.
  insert into tax_code (tenant_id, code, name_ar, rate, eta_tax_type,
                        eta_subtype, output_account_id, input_account_id)
  select v_tenant, x.code, x.name_ar, x.rate, 'T1', x.subtype,
         (select id from account where tenant_id = v_tenant and code = '2130'),
         (select id from account where tenant_id = v_tenant and code = '1160')
  from (values
    ('VAT14', 'ضريبة القيمة المضافة 14%', 14.0, 'V009'),
    ('VAT10', 'ضريبة الجدول 10%',          10.0, 'V009'),
    ('VAT5',  'ضريبة الجدول 5%',            5.0, 'V009'),
    ('VAT0',  'معدل صفري / تصدير',          0.0, 'V003'),
    ('EXEMPT','معفاة',                      0.0, 'V007')
  ) as x(code, name_ar, rate, subtype);

  -- Withholding is deducted by the buyer, not charged on the invoice.
  insert into tax_code (tenant_id, code, name_ar, rate, eta_tax_type,
                        eta_subtype, is_withholding, input_account_id)
  select v_tenant, x.code, x.name_ar, x.rate, 'T4', x.subtype, true,
         (select id from account where tenant_id = v_tenant and code = '1170')
  from (values
    ('WHT1', 'خصم وتحصيل 1%', 1.0, 'W001'),
    ('WHT3', 'خصم وتحصيل 3%', 3.0, 'W003'),
    ('WHT5', 'خصم وتحصيل 5%', 5.0, 'W005')
  ) as x(code, name_ar, rate, subtype);

  insert into uom (tenant_id, code, name_ar, eta_code)
  values
    (v_tenant, 'EA',  'قطعة',  'EA'),
    (v_tenant, 'MTR', 'متر',   'MTR'),
    (v_tenant, 'KGM', 'كيلو',  'KGM'),
    (v_tenant, 'LTR', 'لتر',   'LTR'),
    (v_tenant, 'BOX', 'كرتونة','BX'),
    (v_tenant, 'TON', 'طن',    'TNE');

  -- Wire the posting rules to real accounts.
  insert into account_default (tenant_id, purpose, account_id)
  select v_tenant, x.purpose,
         (select id from account where tenant_id = v_tenant and code = x.code)
  from (values
    ('receivable','1130'), ('payable','2110'),
    ('sales_revenue','4100'), ('purchases','5200'),
    ('vat_output','2130'), ('vat_input','1160'),
    ('cash','1110'), ('bank','1120'),
    ('discount_allowed','4300'),
    ('withholding_receivable','1170'),
    ('rounding','5900')
  ) as x(purpose, code);

  -- Fiscal year with twelve calendar months.
  insert into fiscal_year (tenant_id, name, starts_on, ends_on)
  values (v_tenant, v_year::text,
          make_date(v_year, 1, 1), make_date(v_year, 12, 31))
  returning id into v_fy;

  for m in 1 .. 12 loop
    insert into fiscal_period (tenant_id, fiscal_year_id, name, starts_on, ends_on)
    values (
      v_tenant, v_fy,
      to_char(make_date(v_year, m, 1), 'YYYY-MM'),
      make_date(v_year, m, 1),
      (make_date(v_year, m, 1) + interval '1 month - 1 day')::date
    );
  end loop;

  return v_tenant;
end;
$$;

-- Allocates the next document number for a type, formatted with its year.
create or replace function app.next_document_no(
  p_tenant uuid, p_type app.document_type, p_on date default current_date
)
returns text
language plpgsql
as $$
declare
  v_year   integer := extract(year from p_on)::int;
  v_prefix text := case p_type
    when 'sales_invoice'     then 'INV'
    when 'sales_credit_note' then 'CRN'
    when 'sales_debit_note'  then 'DBN'
    when 'purchase_invoice'  then 'PUR'
    when 'receipt'           then 'RCT'
    when 'payment'           then 'PAY'
  end;
begin
  return format('%s-%s-%s', v_prefix, v_year,
                lpad(app.next_number(p_tenant, p_type::text, v_year)::text, 6, '0'));
end;
$$;
