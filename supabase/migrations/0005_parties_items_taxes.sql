-- =============================================================================
-- 0005  Parties, catalogue and tax codes
-- =============================================================================

create table party (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenant(id) on delete cascade,
  code                text not null,
  name_ar             text not null,
  name_en             text,

  is_customer         boolean not null default true,
  is_supplier         boolean not null default false,

  -- ETA receiver identity. A business receiver must carry a tax registration
  -- number; a person may carry a national id; neither is required for a
  -- walk-in cash sale.
  party_type          app.party_type not null default 'business',
  tax_registration_no text,
  national_id         text,

  country             char(2) not null default 'EG',
  governorate         text,
  city                text,
  street              text,
  building_no         text,
  phone               text,
  email               text,

  -- Control accounts. Receivable/payable postings land here.
  receivable_account_id uuid references account(id),
  payable_account_id    uuid references account(id),

  credit_limit        numeric(18,5),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (tenant_id, code),
  constraint party_is_something check (is_customer or is_supplier),
  constraint party_business_needs_trn
    check (party_type <> 'business' or tax_registration_no is not null
           or not is_customer)
);

create index party_tenant_idx on party (tenant_id) where is_active;
create index party_name_idx   on party using gin (to_tsvector('simple', name_ar));

create trigger party_touch before update on party
  for each row execute function app.touch_updated_at();

-- journal_line.party_id could not be constrained until party existed.
alter table journal_line
  add constraint journal_line_party_fk
  foreign key (party_id) references party(id) on delete restrict;

-- ---------------------------------------------------------------------------
-- Units of measure and catalogue
-- ---------------------------------------------------------------------------

create table uom (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenant(id) on delete cascade,
  code        text not null,
  name_ar     text not null,
  eta_code    text,          -- ETA code table, e.g. 'EA', 'MTR', 'KGM'
  unique (tenant_id, code)
);

create table item (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenant(id) on delete cascade,
  code          text not null,
  name_ar       text not null,
  name_en       text,
  uom_id        uuid references uom(id),

  -- ETA requires a recognised code on every invoice line. Customers will not
  -- have these on day one, which makes catalogue mapping an onboarding task,
  -- not a data-entry one.
  item_code_type text check (item_code_type in ('GS1', 'EGS')),
  item_code      text,

  default_tax_code_id uuid,   -- FK added below, once tax_code exists
  sales_account_id    uuid references account(id),
  purchase_account_id uuid references account(id),

  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (tenant_id, code),
  constraint item_code_pairing
    check ((item_code_type is null) = (item_code is null))
);

create index item_tenant_idx on item (tenant_id) where is_active;

create trigger item_touch before update on item
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Tax codes
-- ---------------------------------------------------------------------------
-- eta_tax_type / eta_subtype carry the authority's own code table values, so a
-- line can be serialised into the ETA document schema without a lookup.
--   T1 = value added tax        V009 = standard rate
--   T2 = table tax, percentage  V003 = zero rated / export
--   T3 = table tax, fixed       V007 = exempt
--   T4 = withholding
-- ---------------------------------------------------------------------------

create table tax_code (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenant(id) on delete cascade,
  code          text not null,
  name_ar       text not null,
  rate          numeric(7,4) not null,

  eta_tax_type  text not null default 'T1',
  eta_subtype   text,

  -- Withholding is deducted by the buyer rather than added to the invoice, so
  -- it posts with the opposite sign.
  is_withholding boolean not null default false,

  output_account_id uuid references account(id),  -- VAT collected on sales
  input_account_id  uuid references account(id),  -- VAT paid on purchases

  is_active     boolean not null default true,
  unique (tenant_id, code),
  constraint tax_code_rate_sane check (rate >= 0 and rate <= 100)
);

alter table item
  add constraint item_default_tax_fk
  foreign key (default_tax_code_id) references tax_code(id);
