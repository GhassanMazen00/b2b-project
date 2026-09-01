-- =============================================================================
-- 0002  Tenancy: companies, branches, users
-- =============================================================================

create table tenant (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  legal_name_ar         text not null,
  legal_name_en         text,

  -- Egyptian Tax Authority issuer identity. Required before any e-invoice can
  -- be submitted; nullable so a tenant can be created and configured later.
  tax_registration_no   text,          -- الرقم الضريبي
  commercial_reg_no     text,          -- السجل التجاري
  eta_client_id         text,
  eta_client_secret     text,          -- server-side only; RLS denies all reads
  eta_environment       text not null default 'preprod'
                          check (eta_environment in ('preprod', 'production')),

  base_currency         char(3) not null default 'EGP',
  vat_registered        boolean not null default false,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint tenant_trn_format
    check (tax_registration_no is null or tax_registration_no ~ '^[0-9]{9}$')
);

comment on column tenant.tax_registration_no is
  'Egyptian tax registration number, 9 digits. Required for ETA submission.';

create table branch (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenant(id) on delete cascade,
  code          text not null,
  name          text not null,

  -- ETA requires a full structured address on the issuing branch.
  country       char(2) not null default 'EG',
  governorate   text,                  -- المحافظة
  city          text,
  street        text,
  building_no   text,
  postal_code   text,
  activity_code text,                  -- كود النشاط

  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (tenant_id, code)
);

create table app_user (
  -- Matches auth.users.id on Supabase. No FK, so the schema also loads on a
  -- plain Postgres instance for testing.
  id            uuid primary key,
  tenant_id     uuid not null references tenant(id) on delete cascade,
  branch_id     uuid references branch(id) on delete set null,

  username      text not null,
  full_name     text not null,
  role          app.user_role not null,

  -- Carried over from AZ Accounting: a manager approves each new login, and
  -- staff sessions are cut off outside working hours.
  is_approved   boolean not null default false,
  approved_by   uuid references app_user(id),
  approved_at   timestamptz,
  is_active     boolean not null default true,
  session_ends_at_hour smallint
                  check (session_ends_at_hour between 0 and 23),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (tenant_id, username)
);

create index app_user_tenant_idx on app_user (tenant_id) where is_active;

create trigger tenant_touch   before update on tenant   for each row execute function app.touch_updated_at();
create trigger branch_touch   before update on branch   for each row execute function app.touch_updated_at();
create trigger app_user_touch before update on app_user for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Tenant + role resolution, used by every RLS policy below.
-- ---------------------------------------------------------------------------

create or replace function app.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select u.tenant_id
  from app_user u
  where u.id = app.current_user_id()
    and u.is_active
    and u.is_approved
$$;

create or replace function app.current_role()
returns app.user_role
language sql
stable
security definer
set search_path = public, app
as $$
  select u.role
  from app_user u
  where u.id = app.current_user_id()
    and u.is_active
    and u.is_approved
$$;

create or replace function app.has_role(variadic roles app.user_role[])
returns boolean
language sql
stable
as $$
  select app.current_role() = any(roles)
$$;

-- Anyone who may see the full financial picture.
create or replace function app.can_read_ledger()
returns boolean
language sql
stable
as $$
  select app.has_role('owner', 'manager', 'supervisor', 'reviewer', 'viewer')
$$;

-- Anyone who may move a document into the ledger.
create or replace function app.can_post()
returns boolean
language sql
stable
as $$
  select app.has_role('owner', 'manager', 'reviewer')
$$;
