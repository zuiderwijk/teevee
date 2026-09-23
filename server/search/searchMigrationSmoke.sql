\set ON_ERROR_STOP on
begin;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create schema extensions;
create schema teevee;

create table teevee.channels (
  id text primary key,
  name text not null,
  display_name text not null,
  sort_order integer not null,
  is_active boolean not null,
  short_name text,
  logo_url text
);

create table teevee.programmes (
  id text primary key,
  channel_id text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  title text not null,
  subtitle text,
  description text,
  genre text,
  is_live boolean,
  is_repeat boolean
);

create table teevee.schedule_coverage (
  id bigint generated always as identity primary key,
  channel_id text not null,
  from_at timestamptz not null,
  to_at timestamptz not null,
  generated_at timestamptz not null,
  coverage_range tstzrange generated always as (
    tstzrange(from_at, to_at, '[)')
  ) stored
);

\ir ../../supabase/migrations/20260923003500_create_guide_search_read_boundary.sql

insert into teevee.channels(
  id, name, display_name, sort_order, is_active, short_name
)
values
  ('nl-npo-1', 'NPO 1', 'NPO 1', 1, true, 'NPO 1'),
  ('nl-rtl-4', 'RTL 4', 'RTL 4', 4, true, 'RTL 4'),
  ('hidden', 'Hidden', 'Hidden', 99, false, 'Hidden');

-- NPO 1 has the complete ten-window horizon. RTL 4 initially misses the last
-- window so programme coverage is partial while covered channel/day pairs
-- remain searchable.
insert into teevee.schedule_coverage(
  channel_id, from_at, to_at, generated_at
)
select
  'nl-npo-1',
  '2026-09-21T04:00:00Z'::timestamptz + make_interval(days => day),
  '2026-09-22T04:00:00Z'::timestamptz + make_interval(days => day),
  '2026-09-23T00:00:00Z'
from generate_series(0, 9) day;

insert into teevee.schedule_coverage(
  channel_id, from_at, to_at, generated_at
)
select
  'nl-rtl-4',
  '2026-09-21T04:00:00Z'::timestamptz + make_interval(days => day),
  '2026-09-22T04:00:00Z'::timestamptz + make_interval(days => day),
  '2026-09-23T00:00:00Z'
from generate_series(0, 8) day;

insert into teevee.programmes(
  id, channel_id, start_at, end_at, title
)
values
  ('historical-old', 'nl-npo-1', '2026-09-21T18:30:00Z', '2026-09-21T19:30:00Z', 'De slimste mens'),
  ('historical-new', 'nl-npo-1', '2026-09-22T18:30:00Z', '2026-09-22T19:30:00Z', 'De slimste mens'),
  ('current', 'nl-npo-1', '2026-09-23T17:30:00Z', '2026-09-23T18:30:00Z', 'De slimste mens'),
  ('future-near', 'nl-npo-1', '2026-09-23T19:00:00Z', '2026-09-23T20:00:00Z', 'De slimste mens'),
  ('future-far', 'nl-npo-1', '2026-09-24T19:00:00Z', '2026-09-24T20:00:00Z', 'De slimste mens'),
  ('prefix-current', 'nl-npo-1', '2026-09-23T17:45:00Z', '2026-09-23T18:45:00Z', 'De slimste mens junior'),
  ('substring-current', 'nl-npo-1', '2026-09-23T17:45:00Z', '2026-09-23T18:45:00Z', 'Vanavond: De slimste mens'),
  ('accented', 'nl-npo-1', '2026-09-25T18:30:00Z', '2026-09-25T19:30:00Z', 'Héél Holland—Bakt!'),
  ('covered-last-window', 'nl-npo-1', '2026-09-30T18:30:00Z', '2026-09-30T19:30:00Z', 'Laatste dag'),
  ('uncovered-last-window', 'nl-rtl-4', '2026-09-30T18:30:00Z', '2026-09-30T19:30:00Z', 'Laatste dag'),
  ('hidden-programme', 'hidden', '2026-09-23T18:30:00Z', '2026-09-23T19:30:00Z', 'Hidden');

do $smoke$
declare
  v_windows jsonb := jsonb_build_array(
    jsonb_build_object('from','2026-09-21T04:00:00Z','to','2026-09-22T04:00:00Z'),
    jsonb_build_object('from','2026-09-22T04:00:00Z','to','2026-09-23T04:00:00Z'),
    jsonb_build_object('from','2026-09-23T04:00:00Z','to','2026-09-24T04:00:00Z'),
    jsonb_build_object('from','2026-09-24T04:00:00Z','to','2026-09-25T04:00:00Z'),
    jsonb_build_object('from','2026-09-25T04:00:00Z','to','2026-09-26T04:00:00Z'),
    jsonb_build_object('from','2026-09-26T04:00:00Z','to','2026-09-27T04:00:00Z'),
    jsonb_build_object('from','2026-09-27T04:00:00Z','to','2026-09-28T04:00:00Z'),
    jsonb_build_object('from','2026-09-28T04:00:00Z','to','2026-09-29T04:00:00Z'),
    jsonb_build_object('from','2026-09-29T04:00:00Z','to','2026-09-30T04:00:00Z'),
    jsonb_build_object('from','2026-09-30T04:00:00Z','to','2026-10-01T04:00:00Z')
  );
  v_result jsonb;
  v_ids jsonb;
begin
  if teevee.normalize_guide_search_text('  Héél   Holland—Bakt!  ') <> 'heel holland bakt' then
    raise exception 'Guide Search normalization mismatch';
  end if;
  if teevee.normalize_guide_search_text('A & B') <> 'a en b' then
    raise exception 'Guide Search ampersand normalization mismatch';
  end if;

  v_result := teevee.search_guide(
    'de slimste mens',
    '2026-09-23T18:00:00Z',
    v_windows,
    24,
    12
  );

  if v_result->>'programmeCoverage' <> 'partial' then
    raise exception 'Expected partial coverage, got %', v_result;
  end if;

  select jsonb_agg(item->'programme'->>'id')
    into v_ids
  from jsonb_array_elements(v_result->'programmeMatches') item;

  if v_ids is distinct from jsonb_build_array(
    'current',
    'future-near',
    'future-far',
    'historical-new',
    'historical-old',
    'prefix-current',
    'substring-current'
  ) then
    raise exception 'Programme ranking mismatch: %', v_ids;
  end if;

  v_result := teevee.search_guide(
    'NPO',
    '2026-09-23T18:00:00Z',
    v_windows,
    24,
    12
  );
  if jsonb_array_length(v_result->'channelMatches') <> 1
     or v_result->'channelMatches'->0->>'id' <> 'nl-npo-1' then
    raise exception 'Channel Search mismatch: %', v_result;
  end if;

  v_result := teevee.search_guide(
    'heel holland bakt',
    '2026-09-23T18:00:00Z',
    v_windows,
    24,
    12
  );
  if jsonb_array_length(v_result->'programmeMatches') <> 1
     or v_result->'programmeMatches'->0->'programme'->>'id' <> 'accented' then
    raise exception 'Diacritic/punctuation Search mismatch: %', v_result;
  end if;

  -- A covered channel may contribute from a day where another channel is not
  -- authoritative. The uncovered RTL 4 programme must not leak into results.
  v_result := teevee.search_guide(
    'Laatste dag',
    '2026-09-23T18:00:00Z',
    v_windows,
    24,
    12
  );
  if jsonb_array_length(v_result->'programmeMatches') <> 1
     or v_result->'programmeMatches'->0->'programme'->>'id' <> 'covered-last-window' then
    raise exception 'Covered-pair Search mismatch: %', v_result;
  end if;

  if has_function_privilege(
    'anon',
    'public.teevee_search_guide(text,timestamptz,jsonb,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'anon unexpectedly has Guide Search RPC access';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.teevee_search_guide(text,timestamptz,jsonb,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'authenticated unexpectedly has Guide Search RPC access';
  end if;
  if not has_function_privilege(
    'service_role',
    'public.teevee_search_guide(text,timestamptz,jsonb,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'service_role is missing Guide Search RPC access';
  end if;

  insert into teevee.schedule_coverage(
    channel_id, from_at, to_at, generated_at
  ) values (
    'nl-rtl-4',
    '2026-09-30T04:00:00Z',
    '2026-10-01T04:00:00Z',
    '2026-09-23T00:00:00Z'
  );

  v_result := teevee.search_guide(
    'geen match',
    '2026-09-23T18:00:00Z',
    v_windows,
    24,
    12
  );
  if v_result->>'programmeCoverage' <> 'complete'
     or jsonb_array_length(v_result->'programmeMatches') <> 0 then
    raise exception 'Complete no-match semantics mismatch: %', v_result;
  end if;

  delete from teevee.schedule_coverage;

  v_result := teevee.search_guide(
    'NPO',
    '2026-09-23T18:00:00Z',
    v_windows,
    24,
    12
  );
  if v_result->>'programmeCoverage' <> 'unavailable'
     or jsonb_array_length(v_result->'programmeMatches') <> 0
     or jsonb_array_length(v_result->'channelMatches') <> 1 then
    raise exception 'Unavailable programme/channel Search semantics mismatch: %', v_result;
  end if;
end;
$smoke$;

rollback;
