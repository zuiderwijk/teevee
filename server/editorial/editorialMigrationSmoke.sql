\set ON_ERROR_STOP on
begin;

-- Minimal disposable PostgreSQL fixture matching the already-applied editorial
-- store contracts needed by the forward lifecycle migration. This smoke never
-- targets the hosted Teevee project.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create schema teevee;

create table teevee.programmes (
  id text primary key,
  channel_id text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  title text not null
);

create table teevee.programme_editorial_signals (
  source text not null,
  signal_type text not null,
  programme_id text not null,
  source_item_id text not null,
  source_url text,
  published_at timestamptz,
  matched_by text not null,
  refreshed_at timestamptz not null,
  primary key (source, signal_type, programme_id),
  unique (source, signal_type, source_item_id)
);

create table teevee.editorial_source_state (
  source text primary key,
  last_success_at timestamptz not null,
  signal_count integer not null
);

create or replace function teevee.get_editorial_signals(
  p_programme_ids text[]
) returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'programmeId', s.programme_id,
        'type', s.signal_type,
        'source', s.source,
        'sourceItemId', s.source_item_id,
        'matchedBy', s.matched_by
      )
      order by s.programme_id
    ),
    '[]'::jsonb
  )
  into v_result
  from teevee.programme_editorial_signals s
  join teevee.programmes p on p.id = s.programme_id
  where s.programme_id = any(p_programme_ids);

  return v_result;
end;
$$;

-- Owner-observed recovery fixture: exact direct tips.rss evidence from PR #120.
insert into teevee.programmes(id, channel_id, start_at, end_at, title)
values (
  'programme-0gh2ai605h9qyw',
  'nl-npo-1',
  '2026-09-22T19:30:00Z',
  '2026-09-22T20:20:00Z',
  'De slimste mens'
);

\ir ../../supabase/migrations/20260923003000_preserve_started_editorial_signals.sql
-- Recovery must be idempotent when the forward migration body is evaluated again.
\ir ../../supabase/migrations/20260923003000_preserve_started_editorial_signals.sql

do $smoke$
declare
  v_result jsonb;
  v_get jsonb;
  v_count integer;
begin
  select count(*)::integer
    into v_count
  from teevee.programme_editorial_signals
  where programme_id = 'programme-0gh2ai605h9qyw'
    and source_item_id =
      'https://www.tvgids.nl/nieuws/televisie/de-slimste-mens-kiki-boreel-amusement-quiz-npo-1-2026-09-22'
    and matched_by = 'channel-title-start';

  if v_count <> 1 then
    raise exception 'owner-observed historical recovery expected exactly 1 row, got %', v_count;
  end if;

  delete from teevee.programme_editorial_signals
  where programme_id = 'programme-0gh2ai605h9qyw';
  delete from teevee.programmes
  where id = 'programme-0gh2ai605h9qyw';

  -- future present / future omitted / started present / started omitted
  insert into teevee.programmes(id, channel_id, start_at, end_at, title)
  values
    ('smoke-started-omit', 'nl-npo-1', '2099-01-01T10:00:00Z', '2099-01-01T11:00:00Z', 'Started omit'),
    ('smoke-started-present', 'nl-npo-1', '2099-01-02T10:00:00Z', '2099-01-02T11:00:00Z', 'Started present'),
    ('smoke-future-omit', 'nl-npo-1', '2099-01-04T10:00:00Z', '2099-01-04T11:00:00Z', 'Future omit'),
    ('smoke-future-present', 'nl-npo-1', '2099-01-04T12:00:00Z', '2099-01-04T13:00:00Z', 'Future present');

  v_result := teevee.replace_editorial_signal_snapshot(
    'tvgids',
    '2099-01-02T12:00:00Z',
    jsonb_build_array(
      jsonb_build_object('programmeId','smoke-started-omit','type','kijktip','source','tvgids','sourceItemId','source-started-omit','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-started-present','type','kijktip','source','tvgids','sourceItemId','source-started-present','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-future-omit','type','kijktip','source','tvgids','sourceItemId','source-future-omit','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-future-present','type','kijktip','source','tvgids','sourceItemId','source-future-present','matchedBy','channel-title-start')
    )
  );
  if v_result->>'status' <> 'stored' then
    raise exception 'initial lifecycle snapshot was not stored: %', v_result;
  end if;

  select count(*)::integer into v_count
  from teevee.programme_editorial_signals
  where programme_id in ('smoke-future-present','smoke-future-omit','smoke-started-present','smoke-started-omit');
  if v_count <> 4 then
    raise exception 'future/started present storage expected 4 rows, got %', v_count;
  end if;

  v_result := teevee.replace_editorial_signal_snapshot(
    'tvgids',
    '2099-01-02T13:00:00Z',
    jsonb_build_array(
      jsonb_build_object('programmeId','smoke-started-present','type','kijktip','source','tvgids','sourceItemId','source-started-present','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-future-present','type','kijktip','source','tvgids','sourceItemId','source-future-present','matchedBy','channel-title-start')
    )
  );

  if exists (
    select 1 from teevee.programme_editorial_signals
    where programme_id = 'smoke-future-omit'
  ) then
    raise exception 'future omitted signal was not removed';
  end if;
  if not exists (
    select 1 from teevee.programme_editorial_signals
    where programme_id = 'smoke-future-present'
  ) then
    raise exception 'future present signal was not retained';
  end if;
  if not exists (
    select 1 from teevee.programme_editorial_signals
    where programme_id = 'smoke-started-present'
  ) then
    raise exception 'started present signal was not retained';
  end if;
  if not exists (
    select 1 from teevee.programme_editorial_signals
    where programme_id = 'smoke-started-omit'
  ) then
    raise exception 'started omitted signal was not retained';
  end if;

  v_get := teevee.get_editorial_signals(array['smoke-started-omit']);
  if jsonb_array_length(v_get) <> 1
     or v_get->0->>'programmeId' <> 'smoke-started-omit' then
    raise exception 'historical getter did not return retained started signal: %', v_get;
  end if;

  -- same sourceItemId -> corrected canonical programme ID because start changed.
  insert into teevee.programmes(id, channel_id, start_at, end_at, title)
  values ('smoke-rekey-old', 'nl-npo-1', '2099-01-04T14:00:00Z', '2099-01-04T15:00:00Z', 'Rekey show');

  v_result := teevee.replace_editorial_signal_snapshot(
    'tvgids',
    '2099-01-03T09:00:00Z',
    jsonb_build_array(
      jsonb_build_object('programmeId','smoke-future-present','type','kijktip','source','tvgids','sourceItemId','source-future-present','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-rekey-old','type','kijktip','source','tvgids','sourceItemId','source-rekey','matchedBy','channel-title-start')
    )
  );

  insert into teevee.programmes(id, channel_id, start_at, end_at, title)
  values ('smoke-rekey-new', 'nl-npo-1', '2099-01-04T14:02:00Z', '2099-01-04T15:02:00Z', 'Rekey show');

  v_result := teevee.replace_editorial_signal_snapshot(
    'tvgids',
    '2099-01-03T10:00:00Z',
    jsonb_build_array(
      jsonb_build_object('programmeId','smoke-future-present','type','kijktip','source','tvgids','sourceItemId','source-future-present','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-rekey-new','type','kijktip','source','tvgids','sourceItemId','source-rekey','matchedBy','channel-title-start')
    )
  );

  select count(*)::integer into v_count
  from teevee.programme_editorial_signals
  where source_item_id = 'source-rekey'
    and programme_id = 'smoke-rekey-new';
  if v_count <> 1 then
    raise exception 'source-item rekey did not land on corrected programme';
  end if;
  if exists (
    select 1 from teevee.programme_editorial_signals
    where source_item_id = 'source-rekey'
      and programme_id = 'smoke-rekey-old'
  ) then
    raise exception 'source-item rekey left the old canonical binding';
  end if;

  -- orphan cleanup remains independent from source-item rekey.
  insert into teevee.programmes(id, channel_id, start_at, end_at, title)
  values ('smoke-orphan', 'nl-npo-1', '2099-01-01T12:00:00Z', '2099-01-01T13:00:00Z', 'Orphan');

  v_result := teevee.replace_editorial_signal_snapshot(
    'tvgids',
    '2099-01-03T11:00:00Z',
    jsonb_build_array(
      jsonb_build_object('programmeId','smoke-future-present','type','kijktip','source','tvgids','sourceItemId','source-future-present','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-rekey-new','type','kijktip','source','tvgids','sourceItemId','source-rekey','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-orphan','type','kijktip','source','tvgids','sourceItemId','source-orphan','matchedBy','channel-title-start')
    )
  );

  delete from teevee.programmes where id = 'smoke-orphan';

  v_result := teevee.replace_editorial_signal_snapshot(
    'tvgids',
    '2099-01-03T12:00:00Z',
    jsonb_build_array(
      jsonb_build_object('programmeId','smoke-future-present','type','kijktip','source','tvgids','sourceItemId','source-future-present','matchedBy','channel-title-start'),
      jsonb_build_object('programmeId','smoke-rekey-new','type','kijktip','source','tvgids','sourceItemId','source-rekey','matchedBy','channel-title-start')
    )
  );

  if exists (
    select 1 from teevee.programme_editorial_signals
    where source_item_id = 'source-orphan'
  ) then
    raise exception 'orphan signal was not cleaned';
  end if;

  -- stale refresh must perform no mutation.
  v_result := teevee.replace_editorial_signal_snapshot(
    'tvgids',
    '2099-01-03T11:30:00Z',
    '[]'::jsonb
  );
  if v_result->>'status' <> 'ignored-stale' then
    raise exception 'stale refresh was not ignored: %', v_result;
  end if;
  if not exists (
    select 1 from teevee.programme_editorial_signals
    where source_item_id = 'source-rekey'
      and programme_id = 'smoke-rekey-new'
  ) then
    raise exception 'stale refresh mutated newer rekey state';
  end if;
end
$smoke$;

rollback;
