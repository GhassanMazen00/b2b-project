-- =============================================================================
-- 0003  Chart of accounts and the fiscal calendar
-- =============================================================================

create table account (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenant(id) on delete cascade,
  parent_id       uuid references account(id) on delete restrict,

  code            text not null,
  name_ar         text not null,
  name_en         text,
  type            app.account_type not null,
  normal_balance  app.normal_balance not null,

  -- Only leaf accounts take postings; parents exist to roll up.
  is_postable     boolean not null default true,
  is_active       boolean not null default true,
  currency        char(3),   -- NULL = tenant base currency

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (tenant_id, code)
);

create index account_tenant_idx on account (tenant_id, code);
create index account_parent_idx on account (parent_id);

create trigger account_touch before update on account
  for each row execute function app.touch_updated_at();

-- A parent account must never carry postings directly.
create or replace function app.assert_account_leaf()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from account where parent_id = new.id) and new.is_postable then
    raise exception
      'account % has children and cannot be postable', new.code
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger account_leaf_check before insert or update on account
  for each row execute function app.assert_account_leaf();

-- ---------------------------------------------------------------------------
-- Fiscal calendar. Posting into a closed period is refused at the database.
-- ---------------------------------------------------------------------------

create table fiscal_year (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenant(id) on delete cascade,
  name        text not null,
  starts_on   date not null,
  ends_on     date not null,
  is_closed   boolean not null default false,
  created_at  timestamptz not null default now(),

  unique (tenant_id, name),
  constraint fiscal_year_range check (ends_on > starts_on),

  -- No two fiscal years for one tenant may overlap.
  constraint fiscal_year_no_overlap
    exclude using gist (
      tenant_id with =,
      daterange(starts_on, ends_on, '[]') with &&
    )
);

create table fiscal_period (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenant(id) on delete cascade,
  fiscal_year_id  uuid not null references fiscal_year(id) on delete cascade,
  name            text not null,
  starts_on       date not null,
  ends_on         date not null,
  is_closed       boolean not null default false,
  closed_at       timestamptz,
  closed_by       uuid references app_user(id),

  constraint fiscal_period_range check (ends_on >= starts_on),
  constraint fiscal_period_no_overlap
    exclude using gist (
      tenant_id with =,
      daterange(starts_on, ends_on, '[]') with &&
    )
);

create index fiscal_period_lookup_idx
  on fiscal_period (tenant_id, starts_on, ends_on);

-- Resolves the period a date falls in, and refuses if it is closed or missing.
create or replace function app.open_period_for(p_tenant uuid, p_on date)
returns uuid
language plpgsql
stable
as $$
declare
  v_period fiscal_period%rowtype;
begin
  select * into v_period
  from fiscal_period
  where tenant_id = p_tenant
    and p_on between starts_on and ends_on;

  if not found then
    raise exception 'no fiscal period covers %', p_on
      using errcode = 'check_violation';
  end if;

  if v_period.is_closed then
    raise exception 'fiscal period % is closed', v_period.name
      using errcode = 'check_violation';
  end if;

  return v_period.id;
end;
$$;
