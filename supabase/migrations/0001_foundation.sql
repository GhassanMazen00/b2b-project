-- =============================================================================
-- 0001  Foundation: extensions, app schema, identity helpers
-- =============================================================================
-- The helpers below read the JWT claims GUC that PostgREST/Supabase sets on
-- every request. Reading the GUC directly (rather than auth.uid()) means the
-- exact same policies run under `psql` in tests, where we set the GUC by hand.
-- =============================================================================

-- gen_random_uuid() is core Postgres since 13, so pgcrypto is not required.
-- Avoiding it keeps the schema loadable anywhere Postgres runs -- including
-- WASM builds, where the contrib extension is unavailable.
do $$
begin
  if current_setting('server_version_num')::int < 130000 then
    raise exception 'PostgreSQL 13 or newer is required (gen_random_uuid)';
  end if;
end $$;

-- Needed for the exclusion constraints that stop fiscal periods overlapping.
create extension if not exists "btree_gist";

create schema if not exists app;
comment on schema app is 'Helper functions and enums. Never contains business rows.';

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create or replace function app.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  )::uuid
$$;
comment on function app.current_user_id is
  'Authenticated user id from the request JWT, or NULL when unauthenticated.';

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Mirrors the six roles proven in AZ Accounting v1.
create type app.user_role as enum (
  'owner',          -- المالك        full control, including settings and users
  'manager',        -- المدير        full operational control
  'supervisor',     -- المشرف        sees everything, changes nothing
  'data_entry',     -- موظف الإدخال  drafts documents, cannot post
  'reviewer',       -- المراجِع      approves or rejects drafted documents
  'viewer',         -- مطّلِع        read-only on parties and their balances
  'invoice_viewer'  -- عرض الفواتير  read-only on documents alone
);

create type app.account_type as enum (
  'asset', 'liability', 'equity', 'revenue', 'expense'
);

create type app.normal_balance as enum ('debit', 'credit');

create type app.document_type as enum (
  'sales_invoice',      -- فاتورة مبيعات
  'sales_credit_note',  -- إشعار دائن
  'sales_debit_note',   -- إشعار مدين
  'purchase_invoice',   -- فاتورة مشتريات
  'receipt',            -- إيصال قبض
  'payment'             -- إيصال صرف
);

create type app.document_status as enum (
  'draft',           -- editable by its author
  'pending_review',  -- editable by author, awaiting reviewer
  'rejected',        -- editable by author, reviewer sent it back
  'posted',          -- IMMUTABLE. Has hit the ledger.
  'cancelled'        -- IMMUTABLE. Reversed by a linked entry.
);

create type app.party_type as enum ('business', 'person', 'foreigner');

-- ---------------------------------------------------------------------------
-- Shared column behaviour
-- ---------------------------------------------------------------------------

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Rounds to 5 decimal places, the precision the ETA schema expects on amounts.
create or replace function app.round5(v numeric)
returns numeric
language sql
immutable
as $$
  select round(coalesce(v, 0), 5)
$$;
