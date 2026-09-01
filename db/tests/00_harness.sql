-- Minimal assertion harness. Records results rather than aborting, so one
-- failure does not hide the rest of the suite.
create schema if not exists tst;

drop table if exists tst.result cascade;
create table tst.result (
  seq     serial primary key,
  name    text not null,
  passed  boolean not null,
  detail  text
);

create or replace function tst.ok(p_name text, p_cond boolean, p_detail text default null)
returns void language plpgsql as $$
begin
  insert into tst.result (name, passed, detail)
  values (p_name, coalesce(p_cond, false),
          case when coalesce(p_cond, false) then null else p_detail end);
end $$;

create or replace function tst.eq(p_name text, p_actual anyelement, p_expected anyelement)
returns void language plpgsql as $$
begin
  insert into tst.result (name, passed, detail)
  values (p_name, p_actual is not distinct from p_expected,
          case when p_actual is not distinct from p_expected then null
               else format('expected %s, got %s', p_expected, p_actual) end);
end $$;

-- Runs a statement that must fail, and checks the message.
create or replace function tst.raises(p_name text, p_sql text, p_expect text)
returns void language plpgsql as $$
declare
  v_msg text;
begin
  begin
    execute p_sql;
    insert into tst.result (name, passed, detail)
    values (p_name, false, 'expected an error, statement succeeded');
    return;
  exception when others then
    v_msg := sqlerrm;
  end;

  insert into tst.result (name, passed, detail)
  values (p_name, position(lower(p_expect) in lower(v_msg)) > 0,
          case when position(lower(p_expect) in lower(v_msg)) > 0 then null
               else format('expected message containing %L, got: %s', p_expect, v_msg) end);
end $$;

-- Runs a statement that must succeed.
create or replace function tst.succeeds(p_name text, p_sql text)
returns void language plpgsql as $$
begin
  execute p_sql;
  insert into tst.result (name, passed, detail) values (p_name, true, null);
exception when others then
  insert into tst.result (name, passed, detail)
  values (p_name, false, format('unexpected error: %s', sqlerrm));
end $$;

create or replace function tst.act_as(p_user uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text)::text, false);
end $$;

-- The RLS suite runs as an unprivileged role, which still has to be able to
-- record its results.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_client') then
    create role app_client nologin;
  end if;
end $$;

grant usage on schema tst to app_client;
grant select, insert on tst.result to app_client;
grant usage, select on sequence tst.result_seq_seq to app_client;
grant execute on all functions in schema tst to app_client;
