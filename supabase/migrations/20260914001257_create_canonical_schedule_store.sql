create extension if not exists btree_gist with schema extensions;
create schema if not exists teevee;

revoke all on schema teevee from public, anon, authenticated;
grant usage on schema teevee to service_role;

create table teevee.channels (
  id text primary key,
  name text not null,
  display_name text not null,
  sort_order integer not null,
  is_active boolean not null,
  short_name text,
  logo_url text,
  updated_at timestamptz not null default now(),
  constraint channels_id_nonempty check (length(btrim(id)) > 0),
  constraint channels_name_nonempty check (length(btrim(name)) > 0),
  constraint channels_display_name_nonempty check (length(btrim(display_name)) > 0)
);

create table teevee.programmes (
  id text primary key,
  channel_id text not null references teevee.channels(id) on update cascade on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  title text not null,
  subtitle text,
  description text,
  genre text,
  is_live boolean,
  is_repeat boolean,
  airing tstzrange generated always as (tstzrange(start_at, end_at, '[)')) stored,
  constraint programmes_id_nonempty check (length(btrim(id)) > 0),
  constraint programmes_title_nonempty check (length(btrim(title)) > 0),
  constraint programmes_time_order check (end_at > start_at)
);

create table teevee.schedule_coverage (
  id bigint generated always as identity primary key,
  channel_id text not null references teevee.channels(id) on update cascade on delete cascade,
  from_at timestamptz not null,
  to_at timestamptz not null,
  generated_at timestamptz not null,
  coverage_range tstzrange generated always as (tstzrange(from_at, to_at, '[)')) stored,
  constraint schedule_coverage_time_order check (to_at > from_at),
  constraint schedule_coverage_no_overlap exclude using gist (channel_id with =, coverage_range with &&)
);

create index programmes_channel_start_idx on teevee.programmes(channel_id, start_at);
create index programmes_channel_airing_idx on teevee.programmes using gist(channel_id, airing);
create index schedule_coverage_channel_from_idx on teevee.schedule_coverage(channel_id, from_at);

alter table teevee.channels enable row level security;
alter table teevee.programmes enable row level security;
alter table teevee.schedule_coverage enable row level security;

revoke all on all tables in schema teevee from public, anon, authenticated;
revoke all on all sequences in schema teevee from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema teevee to service_role;
grant usage, select on all sequences in schema teevee to service_role;

alter default privileges in schema teevee revoke all on tables from public, anon, authenticated;
alter default privileges in schema teevee revoke all on sequences from public, anon, authenticated;
alter default privileges in schema teevee revoke execute on functions from public, anon, authenticated;

create or replace function teevee.replace_schedule_window(
  p_from timestamptz,
  p_to timestamptz,
  p_generated_at timestamptz,
  p_channel_ids text[],
  p_channels jsonb,
  p_programmes jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_channel_ids text[];
  v_channel_id text;
  v_duplicate text;
  v_invalid text;
  v_removed integer := 0;
  v_stored integer := 0;
  v_coverage record;
begin
  if p_from is null or p_to is null or p_to <= p_from then raise exception 'to must be after from'; end if;
  if p_generated_at is null then raise exception 'generatedAt must be a valid timestamp'; end if;
  if p_channel_ids is null or cardinality(p_channel_ids) = 0 then raise exception 'channelIds must contain at least one channel'; end if;
  if jsonb_typeof(p_channels) is distinct from 'array' then raise exception 'channels must be a JSON array'; end if;
  if jsonb_typeof(p_programmes) is distinct from 'array' then raise exception 'programmes must be a JSON array'; end if;
  if exists (select 1 from unnest(p_channel_ids) value where length(btrim(value)) = 0) then raise exception 'channelIds must not contain blank values'; end if;

  select array_agg(id order by id) into v_channel_ids from (select distinct btrim(value) as id from unnest(p_channel_ids) value) ids;

  select c.id into v_duplicate
  from jsonb_to_recordset(p_channels) as c(id text,name text,"displayName" text,"sortOrder" integer,"isActive" boolean,"shortName" text,"logoUrl" text)
  group by c.id having count(*) > 1 limit 1;
  if v_duplicate is not null then raise exception 'Duplicate canonical channel id: %', v_duplicate; end if;

  select c.id into v_invalid
  from jsonb_to_recordset(p_channels) as c(id text,name text,"displayName" text,"sortOrder" integer,"isActive" boolean,"shortName" text,"logoUrl" text)
  where c.id is null or length(btrim(c.id)) = 0 or c.name is null or length(btrim(c.name)) = 0 or c."displayName" is null or length(btrim(c."displayName")) = 0 or c."sortOrder" is null or c."isActive" is null limit 1;
  if found then raise exception 'Canonical channel payload contains missing/invalid required fields'; end if;

  foreach v_channel_id in array v_channel_ids loop
    if not exists (select 1 from jsonb_to_recordset(p_channels) as c(id text,name text,"displayName" text,"sortOrder" integer,"isActive" boolean,"shortName" text,"logoUrl" text) where c.id = v_channel_id) then
      raise exception 'Replacement channel % is missing from the canonical schedule', v_channel_id;
    end if;
  end loop;

  select p.id into v_duplicate
  from jsonb_to_recordset(p_programmes) as p(id text,"channelId" text,"startAt" timestamptz,"endAt" timestamptz,title text,subtitle text,description text,genre text,"isLive" boolean,"isRepeat" boolean)
  group by p.id having count(*) > 1 limit 1;
  if v_duplicate is not null then raise exception 'Duplicate canonical programme id: %', v_duplicate; end if;

  select p.id into v_invalid
  from jsonb_to_recordset(p_programmes) as p(id text,"channelId" text,"startAt" timestamptz,"endAt" timestamptz,title text,subtitle text,description text,genre text,"isLive" boolean,"isRepeat" boolean)
  where p.id is null or length(btrim(p.id)) = 0 or p."channelId" is null or length(btrim(p."channelId")) = 0 or p."startAt" is null or p."endAt" is null or p."endAt" <= p."startAt" or p.title is null or length(btrim(p.title)) = 0 limit 1;
  if found then raise exception 'Canonical programme payload contains missing/invalid required fields'; end if;

  select p.id into v_invalid
  from jsonb_to_recordset(p_programmes) as p(id text,"channelId" text,"startAt" timestamptz,"endAt" timestamptz,title text,subtitle text,description text,genre text,"isLive" boolean,"isRepeat" boolean)
  where not exists (select 1 from jsonb_to_recordset(p_channels) as c(id text,name text,"displayName" text,"sortOrder" integer,"isActive" boolean,"shortName" text,"logoUrl" text) where c.id = p."channelId") limit 1;
  if v_invalid is not null then raise exception 'Programme % references an unknown canonical channel', v_invalid; end if;

  foreach v_channel_id in array v_channel_ids loop perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_channel_id, 0)); end loop;

  if exists (select 1 from teevee.schedule_coverage c where c.channel_id = any(v_channel_ids) and c.coverage_range && tstzrange(p_from,p_to,'[)') and c.generated_at > p_generated_at) then
    return jsonb_build_object('status','ignored-stale','removedProgrammeCount',0,'storedProgrammeCount',0);
  end if;

  insert into teevee.channels(id,name,display_name,sort_order,is_active,short_name,logo_url,updated_at)
  select c.id,c.name,c."displayName",c."sortOrder",c."isActive",c."shortName",c."logoUrl",pg_catalog.now()
  from jsonb_to_recordset(p_channels) as c(id text,name text,"displayName" text,"sortOrder" integer,"isActive" boolean,"shortName" text,"logoUrl" text)
  where c.id = any(v_channel_ids)
  on conflict (id) do update set name=excluded.name,display_name=excluded.display_name,sort_order=excluded.sort_order,is_active=excluded.is_active,short_name=excluded.short_name,logo_url=excluded.logo_url,updated_at=excluded.updated_at;

  if exists (
    select 1
    from jsonb_to_recordset(p_programmes) as p(id text,"channelId" text,"startAt" timestamptz,"endAt" timestamptz,title text,subtitle text,description text,genre text,"isLive" boolean,"isRepeat" boolean)
    join teevee.programmes existing on existing.id = p.id
    where p."channelId" = any(v_channel_ids) and p."startAt" < p_to and p."endAt" > p_from
      and not (existing.channel_id = any(v_channel_ids) and existing.start_at < p_to and existing.end_at > p_from)
  ) then raise exception 'Canonical programme id collision outside replacement scope'; end if;

  delete from teevee.programmes existing where existing.channel_id = any(v_channel_ids) and existing.start_at < p_to and existing.end_at > p_from;
  get diagnostics v_removed = row_count;

  insert into teevee.programmes(id,channel_id,start_at,end_at,title,subtitle,description,genre,is_live,is_repeat)
  select p.id,p."channelId",p."startAt",p."endAt",p.title,p.subtitle,p.description,p.genre,p."isLive",p."isRepeat"
  from jsonb_to_recordset(p_programmes) as p(id text,"channelId" text,"startAt" timestamptz,"endAt" timestamptz,title text,subtitle text,description text,genre text,"isLive" boolean,"isRepeat" boolean)
  where p."channelId" = any(v_channel_ids) and p."startAt" < p_to and p."endAt" > p_from;
  get diagnostics v_stored = row_count;

  foreach v_channel_id in array v_channel_ids loop
    for v_coverage in delete from teevee.schedule_coverage c where c.channel_id=v_channel_id and c.coverage_range && tstzrange(p_from,p_to,'[)') returning c.from_at,c.to_at,c.generated_at loop
      if v_coverage.from_at < p_from then insert into teevee.schedule_coverage(channel_id,from_at,to_at,generated_at) values(v_channel_id,v_coverage.from_at,p_from,v_coverage.generated_at); end if;
      if v_coverage.to_at > p_to then insert into teevee.schedule_coverage(channel_id,from_at,to_at,generated_at) values(v_channel_id,p_to,v_coverage.to_at,v_coverage.generated_at); end if;
    end loop;
    insert into teevee.schedule_coverage(channel_id,from_at,to_at,generated_at) values(v_channel_id,p_from,p_to,p_generated_at);
  end loop;

  return jsonb_build_object('status','stored','removedProgrammeCount',v_removed,'storedProgrammeCount',v_stored);
end;
$$;

create or replace function teevee.get_schedule(p_from timestamptz,p_to timestamptz,p_channel_ids text[] default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
  v_channel_ids text[];
  v_duration_seconds numeric;
  v_oldest_generated_at timestamptz;
  v_channels jsonb;
  v_programmes jsonb;
begin
  if p_from is null or p_to is null or p_to <= p_from then raise exception 'to must be after from'; end if;
  if p_channel_ids is not null and cardinality(p_channel_ids)=0 then raise exception 'channelIds must contain at least one channel when provided'; end if;
  if p_channel_ids is not null and exists(select 1 from unnest(p_channel_ids) value where length(btrim(value))=0) then raise exception 'channelIds must not contain blank values'; end if;

  if p_channel_ids is null then
    select array_agg(c.id order by c.sort_order,c.id) into v_channel_ids from teevee.channels c;
  else
    select array_agg(c.id order by c.sort_order,c.id) into v_channel_ids from teevee.channels c where c.id=any(array(select distinct btrim(value) from unnest(p_channel_ids) value));
    if cardinality(v_channel_ids) is distinct from (select count(distinct btrim(value))::integer from unnest(p_channel_ids) value) then return null; end if;
  end if;
  if v_channel_ids is null or cardinality(v_channel_ids)=0 then return null; end if;

  v_duration_seconds := extract(epoch from (p_to-p_from));
  if (select count(*) from (
      select channel_id from teevee.schedule_coverage
      where channel_id=any(v_channel_ids) and coverage_range && tstzrange(p_from,p_to,'[)')
      group by channel_id
      having sum(extract(epoch from (least(to_at,p_to)-greatest(from_at,p_from)))) >= v_duration_seconds
    ) covered) <> cardinality(v_channel_ids) then return null; end if;

  select min(generated_at) into v_oldest_generated_at
  from teevee.schedule_coverage
  where channel_id=any(v_channel_ids) and coverage_range && tstzrange(p_from,p_to,'[)');

  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',c.id,'name',c.name,'displayName',c.display_name,'sortOrder',c.sort_order,'isActive',c.is_active,'shortName',c.short_name,'logoUrl',c.logo_url)) order by c.sort_order,c.id),'[]'::jsonb)
  into v_channels from teevee.channels c where c.id=any(v_channel_ids);

  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',p.id,'channelId',p.channel_id,'startAt',p.start_at,'endAt',p.end_at,'title',p.title,'subtitle',p.subtitle,'description',p.description,'genre',p.genre,'isLive',p.is_live,'isRepeat',p.is_repeat)) order by c.sort_order,c.id,p.start_at,p.id),'[]'::jsonb)
  into v_programmes
  from teevee.programmes p join teevee.channels c on c.id=p.channel_id
  where p.channel_id=any(v_channel_ids) and p.start_at<p_to and p.end_at>p_from;

  return jsonb_build_object('generatedAt',v_oldest_generated_at,'timezone','Europe/Amsterdam','channels',v_channels,'programmes',v_programmes);
end;
$$;

revoke execute on all functions in schema teevee from public, anon, authenticated;
grant execute on function teevee.replace_schedule_window(timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb) to service_role;
grant execute on function teevee.get_schedule(timestamptz,timestamptz,text[]) to service_role;
