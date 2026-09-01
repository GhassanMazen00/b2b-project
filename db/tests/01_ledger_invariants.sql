-- =============================================================================
-- Ledger invariants: balance, immutability, reversal, periods
-- =============================================================================
\set ON_ERROR_STOP on

do $$
declare
  v_owner  uuid := '11111111-1111-1111-1111-111111111111';
  v_tenant uuid;
  v_period uuid;
  v_cash   uuid;
  v_sales  uuid;
  v_entry  uuid;
begin
  v_tenant := app.provision_tenant('AZ Textiles', 'أ ز للمنسوجات', v_owner);
  perform tst.act_as(v_owner);

  perform tst.ok('provision: tenant created', v_tenant is not null);
  perform tst.eq('provision: chart of accounts loaded',
    (select count(*)::int from account where tenant_id = v_tenant), 41);
  perform tst.eq('provision: 12 fiscal periods',
    (select count(*)::int from fiscal_period where tenant_id = v_tenant), 12);
  perform tst.eq('provision: 8 tax codes',
    (select count(*)::int from tax_code where tenant_id = v_tenant), 8);
  perform tst.ok('provision: parent accounts are not postable',
    (select not is_postable from account where tenant_id = v_tenant and code = '1000'));

  select id into v_period from fiscal_period
   where tenant_id = v_tenant and starts_on <= current_date and ends_on >= current_date;
  select id into v_cash  from account where tenant_id = v_tenant and code = '1110';
  select id into v_sales from account where tenant_id = v_tenant and code = '4100';

  -- --- balanced entry is accepted -----------------------------------------
  insert into journal_entry (tenant_id, fiscal_period_id, entry_no, entry_date, posted_by)
  values (v_tenant, v_period, app.next_number(v_tenant,'journal',2026), current_date, v_owner)
  returning id into v_entry;

  insert into journal_line (entry_id, tenant_id, line_no, account_id, debit, credit)
  values (v_entry, v_tenant, 1, v_cash,  1000, 0),
         (v_entry, v_tenant, 2, v_sales,    0, 1000);

  perform tst.ok('ledger: balanced entry accepted', true);
end $$;

-- The balance check is deferred, so it only fires at COMMIT or when constraints
-- are forced immediate. A plpgsql exception block gives us a subtransaction:
-- the bad inserts roll back, but the recorded result survives.
do $$
declare
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_period uuid; v_cash uuid; v_sales uuid; v_entry uuid;
begin
  select id into v_period from fiscal_period
   where tenant_id = v_tenant and current_date between starts_on and ends_on;
  select id into v_cash  from account where tenant_id = v_tenant and code = '1110';
  select id into v_sales from account where tenant_id = v_tenant and code = '4100';

  -- unbalanced by 1 EGP
  begin
    insert into journal_entry (tenant_id, fiscal_period_id, entry_no, entry_date, posted_by)
    values (v_tenant, v_period, 9001, current_date,
            '11111111-1111-1111-1111-111111111111')
    returning id into v_entry;

    insert into journal_line (entry_id, tenant_id, line_no, account_id, debit, credit)
    values (v_entry, v_tenant, 1, v_cash,  1000, 0),
           (v_entry, v_tenant, 2, v_sales,    0, 999);

    set constraints all immediate;
    perform tst.ok('ledger: unbalanced entry rejected', false,
                   'constraint did not fire');
  exception when others then
    perform tst.ok('ledger: unbalanced entry rejected',
                   position('out of balance' in sqlerrm) > 0, sqlerrm);
  end;
  set constraints all deferred;

  -- single-legged entry
  begin
    insert into journal_entry (tenant_id, fiscal_period_id, entry_no, entry_date, posted_by)
    values (v_tenant, v_period, 9002, current_date,
            '11111111-1111-1111-1111-111111111111')
    returning id into v_entry;

    insert into journal_line (entry_id, tenant_id, line_no, account_id, debit, credit)
    values (v_entry, v_tenant, 1, v_cash, 500, 0);

    set constraints all immediate;
    perform tst.ok('ledger: single-line entry rejected', false, 'no error');
  exception when others then
    perform tst.ok('ledger: single-line entry rejected',
                   position('at least 2' in sqlerrm) > 0, sqlerrm);
  end;
  set constraints all deferred;
end $$;

-- --- immutability -----------------------------------------------------------
do $$
declare
  v_entry uuid := (select id from journal_entry
                   where tenant_id = (select id from tenant where name='AZ Textiles')
                   order by entry_no limit 1);
  v_line  uuid := (select id from journal_line where entry_id = v_entry limit 1);
begin
  perform tst.raises('ledger: UPDATE on journal_entry refused',
    format('update journal_entry set memo_ar = ''tampered'' where id = %L', v_entry),
    'append-only');

  perform tst.raises('ledger: DELETE on journal_entry refused',
    format('delete from journal_entry where id = %L', v_entry),
    'append-only');

  perform tst.raises('ledger: UPDATE on journal_line refused',
    format('update journal_line set debit = 999999 where id = %L', v_line),
    'append-only');

  perform tst.raises('ledger: DELETE on journal_line refused',
    format('delete from journal_line where id = %L', v_line),
    'append-only');
end $$;

-- --- line sanity ------------------------------------------------------------
do $$
declare
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_entry  uuid := (select id from journal_entry where tenant_id = v_tenant limit 1);
  v_cash   uuid := (select id from account where tenant_id = v_tenant and code = '1110');
begin
  perform tst.raises('ledger: line cannot be both debit and credit',
    format('insert into journal_line (entry_id, tenant_id, line_no, account_id, debit, credit)
            values (%L, %L, 99, %L, 10, 10)', v_entry, v_tenant, v_cash),
    'journal_line_one_side');

  perform tst.raises('ledger: line cannot be neither debit nor credit',
    format('insert into journal_line (entry_id, tenant_id, line_no, account_id, debit, credit)
            values (%L, %L, 98, %L, 0, 0)', v_entry, v_tenant, v_cash),
    'journal_line_one_side');

  perform tst.raises('ledger: negative amounts refused',
    format('insert into journal_line (entry_id, tenant_id, line_no, account_id, debit, credit)
            values (%L, %L, 97, %L, -5, 0)', v_entry, v_tenant, v_cash),
    'journal_line_non_negative');
end $$;

-- --- reversal ---------------------------------------------------------------
do $$
declare
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_entry  uuid := (select id from journal_entry where tenant_id = v_tenant
                    order by entry_no limit 1);
  v_rev    uuid;
begin
  v_rev := app.reverse_entry(v_entry);

  perform tst.ok('reversal: created', v_rev is not null);
  perform tst.eq('reversal: links back to the original',
    (select reverses_entry_id from journal_entry where id = v_rev), v_entry);
  perform tst.eq('reversal: debits and credits are swapped',
    (select sum(debit) from journal_line where entry_id = v_rev),
    (select sum(credit) from journal_line where entry_id = v_entry));
  perform tst.eq('reversal: original and reversal net to zero',
    (select sum(debit - credit) from journal_line
      where entry_id in (v_entry, v_rev)), 0::numeric);

  perform tst.raises('reversal: an entry cannot be reversed twice',
    format('select app.reverse_entry(%L)', v_entry),
    'already been reversed');
end $$;

-- --- closed periods ---------------------------------------------------------
do $$
declare
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_closed date;
begin
  update fiscal_period set is_closed = true
   where tenant_id = v_tenant and name = to_char(current_date, 'YYYY') || '-01';

  select starts_on into v_closed from fiscal_period
   where tenant_id = v_tenant and name = to_char(current_date, 'YYYY') || '-01';

  perform tst.raises('periods: posting into a closed period is refused',
    format('select app.open_period_for(%L, %L)', v_tenant, v_closed),
    'is closed');

  perform tst.raises('periods: a date with no period is refused',
    format('select app.open_period_for(%L, %L)', v_tenant, '1990-06-01'::date),
    'no fiscal period');

  update fiscal_period set is_closed = false
   where tenant_id = v_tenant and name = to_char(current_date, 'YYYY') || '-01';
end $$;

-- --- gap-free numbering -----------------------------------------------------
do $$
declare
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_a bigint; v_b bigint; v_c bigint;
begin
  v_a := app.next_number(v_tenant, 'test_scope', 2026);
  v_b := app.next_number(v_tenant, 'test_scope', 2026);
  v_c := app.next_number(v_tenant, 'test_scope', 2026);
  perform tst.ok('numbering: sequential with no gaps',
    v_a = 1 and v_b = 2 and v_c = 3,
    format('got %s, %s, %s', v_a, v_b, v_c));
end $$;
