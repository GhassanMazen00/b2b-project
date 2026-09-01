-- =============================================================================
-- ETA submission queue: leasing, retry backoff, and recovery
-- =============================================================================

do $$
declare
  v_owner  uuid := '11111111-1111-1111-1111-111111111111';
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_branch uuid := (select id from branch where tenant_id = v_tenant);
  v_cust   uuid := (select id from party where tenant_id = v_tenant and code = 'C001');
  v_doc    uuid;
  v_sub    uuid;
  v_claim1 int;
  v_claim2 int;
  v_next   timestamptz;
  v_prev   timestamptz;
begin
  perform tst.act_as(v_owner);

  -- A fresh posted invoice to work with.
  insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                        issued_on, created_by)
  values (v_tenant, v_branch, 'sales_invoice',
          app.next_document_no(v_tenant, 'sales_invoice'), v_cust,
          current_date, v_owner)
  returning id into v_doc;

  insert into document_line (document_id, tenant_id, line_no, description,
                             quantity, unit_price)
  values (v_doc, v_tenant, 1, 'أقمشة قطنية', 20, 150);

  perform app.submit_document(v_doc);
  perform app.post_document(v_doc);

  select id into v_sub from eta_submission where document_id = v_doc;
  perform tst.ok('queue: posting enqueued the invoice', v_sub is not null);
  perform tst.eq('queue: starts pending',
    (select state from eta_submission where id = v_sub), 'pending');
  perform tst.eq('queue: starts with zero attempts',
    (select attempts from eta_submission where id = v_sub), 0);

  -- --- leasing --------------------------------------------------------------
  select count(*) into v_claim1
  from app.claim_eta_submissions('worker-a', 10) where id = v_sub;
  perform tst.eq('queue: a worker can claim a due submission', v_claim1, 1);

  perform tst.eq('queue: a claimed submission is in flight',
    (select state from eta_submission where id = v_sub), 'in_flight');
  perform tst.eq('queue: the attempt counter advanced',
    (select attempts from eta_submission where id = v_sub), 1);
  perform tst.eq('queue: the lease records its holder',
    (select locked_by from eta_submission where id = v_sub), 'worker-a');

  -- A second worker must not pick up the same row.
  select count(*) into v_claim2
  from app.claim_eta_submissions('worker-b', 10) where id = v_sub;
  perform tst.eq('queue: a second worker cannot claim the same submission',
    v_claim2, 0);

  -- --- transient failure and backoff ---------------------------------------
  perform app.fail_eta_submission(v_sub,
    '{"message":"connection reset","code":"ETIMEDOUT"}'::jsonb, false);

  perform tst.eq('queue: a transient failure returns it to pending',
    (select state from eta_submission where id = v_sub), 'pending');
  perform tst.ok('queue: the retry is scheduled in the future',
    (select next_attempt_at from eta_submission where id = v_sub) > now());
  perform tst.eq('queue: the failure was logged as an attempt',
    (select count(*)::int from eta_submission_attempt where submission_id = v_sub), 1);
  perform tst.eq('queue: the document is not marked failed on a transient error',
    (select eta_status from document where id = v_doc), 'queued');

  select next_attempt_at into v_prev from eta_submission where id = v_sub;

  -- Backoff grows with each attempt.
  update eta_submission set next_attempt_at = now() where id = v_sub;
  perform app.claim_eta_submissions('worker-a', 10);
  perform app.fail_eta_submission(v_sub, '{"message":"again"}'::jsonb, false);
  select next_attempt_at into v_next from eta_submission where id = v_sub;

  perform tst.ok('queue: backoff lengthens on the second failure',
    v_next > v_prev,
    format('first retry %s, second retry %s', v_prev, v_next));

  -- --- stale lease recovery -------------------------------------------------
  update eta_submission
     set state = 'in_flight', locked_at = now() - interval '30 minutes',
         locked_by = 'worker-crashed'
   where id = v_sub;

  perform tst.eq('queue: a dead worker''s lease is reclaimed',
    app.reclaim_stale_eta_leases(interval '10 minutes'), 1);
  perform tst.eq('queue: the reclaimed submission is pending again',
    (select state from eta_submission where id = v_sub), 'pending');
  perform tst.ok('queue: a fresh lease is not reclaimed',
    app.reclaim_stale_eta_leases(interval '10 minutes') = 0);

  -- --- success --------------------------------------------------------------
  update eta_submission set next_attempt_at = now() where id = v_sub;
  perform app.claim_eta_submissions('worker-a', 10);
  perform app.complete_eta_submission(v_sub, 'UUID-ABC-123', 'LONGID-XYZ',
    '{"status":"Valid"}'::jsonb);

  perform tst.eq('queue: a successful submission is marked succeeded',
    (select state from eta_submission where id = v_sub), 'succeeded');
  perform tst.eq('queue: the document carries the ETA uuid',
    (select eta_uuid from document where id = v_doc), 'UUID-ABC-123');
  perform tst.eq('queue: the document is marked valid',
    (select eta_status from document where id = v_doc), 'valid');
  perform tst.ok('queue: the clearance timestamp was recorded',
    (select eta_submitted_at from document where id = v_doc) is not null);
  perform tst.ok('queue: the lease was released',
    (select locked_by from eta_submission where id = v_sub) is null);
end $$;

-- --- permanent rejection ------------------------------------------------------
do $$
declare
  v_owner  uuid := '11111111-1111-1111-1111-111111111111';
  v_tenant uuid := (select id from tenant where name = 'AZ Textiles');
  v_branch uuid := (select id from branch where tenant_id = v_tenant);
  v_cust   uuid := (select id from party where tenant_id = v_tenant and code = 'C001');
  v_doc    uuid;
  v_sub    uuid;
begin
  perform tst.act_as(v_owner);

  insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                        issued_on, created_by)
  values (v_tenant, v_branch, 'sales_invoice',
          app.next_document_no(v_tenant, 'sales_invoice'), v_cust,
          current_date, v_owner)
  returning id into v_doc;
  insert into document_line (document_id, tenant_id, line_no, description,
                             quantity, unit_price)
  values (v_doc, v_tenant, 1, 'صنف بدون كود', 1, 100);
  perform app.submit_document(v_doc);
  perform app.post_document(v_doc);

  select id into v_sub from eta_submission where document_id = v_doc;
  perform app.claim_eta_submissions('worker-a', 10);

  -- A schema rejection is not worth retrying; the payload will not improve.
  perform app.fail_eta_submission(v_sub,
    '{"message":"Invalid item code","code":"4013"}'::jsonb, true);

  perform tst.eq('queue: a permanent rejection stops retrying',
    (select state from eta_submission where id = v_sub), 'failed');
  perform tst.eq('queue: the document is marked rejected',
    (select eta_status from document where id = v_doc), 'rejected');
  perform tst.ok('queue: the rejection reason is kept for the user',
    (select eta_error ->> 'message' from document where id = v_doc)
      = 'Invalid item code');
  perform tst.eq('queue: a failed submission is not claimed again',
    (select count(*)::int from app.claim_eta_submissions('worker-a', 10)
      where id = v_sub), 0);

  -- Exhausting the attempt budget also gives up.
  update eta_submission
     set state = 'pending', attempts = 12, max_attempts = 12,
         next_attempt_at = now()
   where id = v_sub;
  perform app.claim_eta_submissions('worker-a', 10);
  perform app.fail_eta_submission(v_sub, '{"message":"still down"}'::jsonb, false);
  perform tst.eq('queue: the attempt budget is enforced',
    (select state from eta_submission where id = v_sub), 'failed');

  -- Clearance state may move on a posted document; the numbers may not.
  perform tst.raises('queue: clearance cannot smuggle in an amount change',
    format('update document set eta_status = ''valid'', total = 999 where id = %L', v_doc),
    'cannot be edited');
end $$;
