-- =============================================================================
-- Document lifecycle: draft, review, posting, freeze, cancellation
-- =============================================================================

do $$
declare
  v_owner  uuid := '11111111-1111-1111-1111-111111111111';
  v_entry  uuid := '22222222-2222-2222-2222-222222222222';  -- data entry clerk
  v_rev    uuid := '33333333-3333-3333-3333-333333333333';  -- reviewer
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_branch uuid;
  v_cust   uuid;
  v_item   uuid;
  v_vat    uuid;
  v_doc    uuid;
  v_je     uuid;
  v_no     text;
begin
  select id into v_branch from branch where tenant_id = v_tenant;

  insert into app_user (id, tenant_id, branch_id, username, full_name, role,
                        is_approved, approved_at)
  values (v_entry, v_tenant, v_branch, 'worker1', 'موظف الإدخال', 'data_entry', true, now()),
         (v_rev,   v_tenant, v_branch, 'worker2', 'المراجِع',      'reviewer',   true, now());

  select id into v_vat from tax_code where tenant_id = v_tenant and code = 'VAT14';

  insert into party (tenant_id, code, name_ar, party_type, tax_registration_no)
  values (v_tenant, 'C001', 'محلات النيل للأقمشة', 'business', '123456789')
  returning id into v_cust;

  insert into item (tenant_id, code, name_ar, item_code_type, item_code,
                    default_tax_code_id)
  values (v_tenant, 'F-100', 'شيفون مطبوع', 'EGS', 'EG-123456789-F100', v_vat)
  returning id into v_item;

  -- === clerk drafts an invoice ============================================
  perform tst.act_as(v_entry);
  v_no := app.next_document_no(v_tenant, 'sales_invoice');

  insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                        issued_on, due_on, created_by)
  values (v_tenant, v_branch, 'sales_invoice', v_no, v_cust,
          current_date, current_date + 30, v_entry)
  returning id into v_doc;

  insert into document_line (document_id, tenant_id, line_no, item_id,
                             description, quantity, unit_price, tax_code_id)
  values (v_doc, v_tenant, 1, v_item, 'شيفون مطبوع 140 سم', 100, 95, v_vat),
         (v_doc, v_tenant, 2, v_item, 'دنيم ستريتش 150 سم',  50, 265, v_vat);

  perform tst.eq('doc: numbering formatted',
    left(v_no, 4), 'INV-');

  -- 100*95 + 50*265 = 9500 + 13250 = 22750 net; VAT 14% = 3185; total 25935
  perform tst.eq('doc: subtotal computed from lines',
    (select subtotal from document where id = v_doc), 22750.00000::numeric);
  perform tst.eq('doc: VAT at 14% computed',
    (select tax_total from document where id = v_doc), 3185.00000::numeric);
  perform tst.eq('doc: total = net + VAT',
    (select total from document where id = v_doc), 25935.00000::numeric);

  perform tst.succeeds('doc: a draft can be edited',
    format('update document set notes = ''تسليم بالفرع'' where id = %L', v_doc));

  -- === submit for review ==================================================
  perform app.submit_document(v_doc);
  perform tst.eq('workflow: submitted moves to pending_review',
    (select status from document where id = v_doc), 'pending_review'::app.document_status);
  perform tst.eq('workflow: appears in the reviewer queue',
    (select count(*)::int from review_queue where id = v_doc), 1);

  -- === four eyes ===========================================================
  perform tst.raises('workflow: the creator cannot approve their own document',
    format('select app.approve_document(%L)', v_doc),
    'cannot be approved by the user who created it');

  -- === reviewer approves ===================================================
  perform tst.act_as(v_rev);
  v_je := app.approve_document(v_doc);

  perform tst.eq('workflow: approval posts the document',
    (select status from document where id = v_doc), 'posted'::app.document_status);
  perform tst.ok('workflow: a journal entry was created', v_je is not null);
  perform tst.eq('workflow: reviewer recorded',
    (select reviewed_by from document where id = v_doc), v_rev);

  -- === the posting itself ==================================================
  perform tst.eq('posting: entry balances',
    (select sum(debit) - sum(credit) from journal_line where entry_id = v_je),
    0::numeric);
  perform tst.eq('posting: receivable debited with the gross',
    (select debit from journal_line jl join account a on a.id = jl.account_id
      where jl.entry_id = v_je and a.code = '1130'), 25935.00000::numeric);
  perform tst.eq('posting: revenue credited with the net',
    (select credit from journal_line jl join account a on a.id = jl.account_id
      where jl.entry_id = v_je and a.code = '4100'), 22750.00000::numeric);
  perform tst.eq('posting: output VAT credited',
    (select credit from journal_line jl join account a on a.id = jl.account_id
      where jl.entry_id = v_je and a.code = '2130'), 3185.00000::numeric);
  perform tst.eq('posting: receivable line carries the customer',
    (select party_id from journal_line jl join account a on a.id = jl.account_id
      where jl.entry_id = v_je and a.code = '1130'), v_cust);

  -- === freeze ==============================================================
  perform tst.raises('freeze: a posted document cannot be edited',
    format('update document set total = 1 where id = %L', v_doc),
    'cannot be edited');

  perform tst.raises('freeze: a posted document cannot be deleted',
    format('delete from document where id = %L', v_doc),
    'only a draft may be deleted');

  perform tst.raises('freeze: lines of a posted document cannot change',
    format('update document_line set quantity = 999 where document_id = %L', v_doc),
    'cannot modify lines');

  perform tst.raises('freeze: lines cannot be added to a posted document',
    format('insert into document_line (document_id, tenant_id, line_no,
            description, quantity, unit_price)
            values (%L, %L, 9, ''تهريب'', 1, 1)', v_doc, v_tenant),
    'cannot modify lines');

  perform tst.raises('freeze: a posted document cannot be re-posted',
    format('select app.post_document(%L)', v_doc),
    'already posted');

  -- === ETA queue ===========================================================
  perform tst.eq('eta: posting queues the invoice',
    (select count(*)::int from eta_submission where document_id = v_doc), 1);
  perform tst.eq('eta: document marked queued',
    (select eta_status from document where id = v_doc), 'queued');

  -- === reporting ===========================================================
  perform tst.eq('report: customer balance reflects the invoice',
    (select balance from party_balance where party_id = v_cust),
    25935.00000::numeric);
  perform tst.eq('report: invoice appears in ageing as current',
    (select bucket from receivable_ageing where document_id = v_doc), 'current');
end $$;

-- =============================================================================
-- Receipt against the invoice
-- =============================================================================
do $$
declare
  v_owner  uuid := '11111111-1111-1111-1111-111111111111';
  v_rev    uuid := '33333333-3333-3333-3333-333333333333';
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_branch uuid := (select id from branch where tenant_id = v_tenant);
  v_cust   uuid := (select id from party where tenant_id = v_tenant and code = 'C001');
  v_inv    uuid := (select id from document where tenant_id = v_tenant
                    and doc_type = 'sales_invoice' and status = 'posted' limit 1);
  v_rcpt   uuid;
  v_je     uuid;
begin
  perform tst.act_as(v_owner);

  insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                        issued_on, created_by)
  values (v_tenant, v_branch, 'receipt',
          app.next_document_no(v_tenant, 'receipt'), v_cust, current_date, v_owner)
  returning id into v_rcpt;

  insert into document_line (document_id, tenant_id, line_no, description,
                             quantity, unit_price)
  values (v_rcpt, v_tenant, 1, 'دفعة تحت الحساب', 1, 10000);

  perform app.submit_document(v_rcpt);
  perform tst.act_as(v_rev);
  v_je := app.approve_document(v_rcpt);

  insert into settlement (tenant_id, receipt_id, invoice_id, amount)
  values (v_tenant, v_rcpt, v_inv, 10000);

  perform tst.eq('receipt: entry balances',
    (select sum(debit) - sum(credit) from journal_line where entry_id = v_je),
    0::numeric);
  perform tst.eq('receipt: cash debited',
    (select debit from journal_line jl join account a on a.id = jl.account_id
      where jl.entry_id = v_je and a.code = '1110'), 10000.00000::numeric);
  perform tst.eq('receipt: receivable credited',
    (select credit from journal_line jl join account a on a.id = jl.account_id
      where jl.entry_id = v_je and a.code = '1130'), 10000.00000::numeric);
  perform tst.eq('receipt: customer balance reduced',
    (select balance from party_balance where party_id = v_cust),
    15935.00000::numeric);
  perform tst.eq('receipt: ageing shows the outstanding remainder',
    (select outstanding from receivable_ageing where document_id = v_inv),
    15935.00000::numeric);
  perform tst.eq('receipt: statement running balance agrees',
    (select running_balance from party_statement
      where party_id = v_cust order by entry_date desc, entry_no desc limit 1),
    15935.00000::numeric);
end $$;

-- =============================================================================
-- Cancellation, credit notes, and the trial balance
-- =============================================================================
do $$
declare
  v_owner  uuid := '11111111-1111-1111-1111-111111111111';
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_branch uuid := (select id from branch where tenant_id = v_tenant);
  v_cust   uuid := (select id from party where tenant_id = v_tenant and code = 'C001');
  v_doc    uuid;
  v_rcpt   uuid := (select id from document where tenant_id = v_tenant
                    and doc_type = 'receipt' limit 1);
  v_reversal uuid;
begin
  perform tst.act_as(v_owner);

  perform tst.raises('credit note: must name the document it corrects',
    format('insert into document (tenant_id, branch_id, doc_type, doc_no,
             party_id, created_by)
            values (%L, %L, ''sales_credit_note'', ''CRN-X'', %L, %L)',
           v_tenant, v_branch, v_cust, v_owner),
    'document_credit_note_corrects');

  -- Cancel the receipt (not yet cleared by the authority).
  v_reversal := app.cancel_document(v_rcpt, 'خطأ في المبلغ');

  perform tst.eq('cancel: document marked cancelled',
    (select status from document where id = v_rcpt), 'cancelled'::app.document_status);
  perform tst.ok('cancel: a reversing entry was written', v_reversal is not null);
  perform tst.eq('cancel: the reversal nets the original to zero',
    (select sum(debit - credit) from journal_line
      where entry_id in (v_reversal,
        (select journal_entry_id from document where id = v_rcpt))), 0::numeric);
  perform tst.eq('cancel: customer balance restored',
    (select balance from party_balance where party_id = v_cust),
    25935.00000::numeric);

  perform tst.raises('cancel: a cancelled document cannot be cancelled again',
    format('select app.cancel_document(%L, ''مرة أخرى'')', v_rcpt),
    'only a posted document may be cancelled');

  -- A document the authority has cleared is no longer ours to cancel.
  insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                        issued_on, created_by)
  values (v_tenant, v_branch, 'sales_invoice',
          app.next_document_no(v_tenant, 'sales_invoice'), v_cust, current_date, v_owner)
  returning id into v_doc;
  insert into document_line (document_id, tenant_id, line_no, description,
                             quantity, unit_price)
  values (v_doc, v_tenant, 1, 'بضاعة', 1, 500);
  perform app.submit_document(v_doc);
  perform app.post_document(v_doc);
  update document set eta_status = 'valid', eta_uuid = 'ABC123' where id = v_doc;

  perform tst.raises('cancel: a cleared invoice must be credit-noted, not cancelled',
    format('select app.cancel_document(%L, ''تصحيح'')', v_doc),
    'cleared by the Tax Authority');

  -- A blank reason, against a document that is genuinely cancellable.
  declare
    v_cancellable uuid;
  begin
    insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                          issued_on, created_by)
    values (v_tenant, v_branch, 'sales_invoice',
            app.next_document_no(v_tenant, 'sales_invoice'), v_cust,
            current_date, v_owner)
    returning id into v_cancellable;
    insert into document_line (document_id, tenant_id, line_no, description,
                               quantity, unit_price)
    values (v_cancellable, v_tenant, 1, 'بضاعة', 1, 100);
    perform app.submit_document(v_cancellable);
    perform app.post_document(v_cancellable);

    perform tst.raises('cancel: a blank reason is refused',
      format('select app.cancel_document(%L, ''   '')', v_cancellable),
      'cancellation reason is required');
  end;

  -- The whole point of double entry.
  perform tst.eq('report: trial balance nets to zero',
    (select sum(total_debit - total_credit) from trial_balance
      where tenant_id = v_tenant), 0::numeric);
end $$;
