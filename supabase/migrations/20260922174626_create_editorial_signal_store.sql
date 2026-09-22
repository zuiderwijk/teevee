-- Optional programme-level editorial enrichment for Teevee Guide.
--
-- Deliberately no foreign key from programme_editorial_signals.programme_id to
-- teevee.programmes: canonical schedule window replacement deletes/reinserts programme
-- rows by design (ADR 0007). A cascading FK would therefore erase editorial state during
-- normal EPG refreshes. Snapshot writes validate referenced programme IDs transactionally,
-- reads only expose signals for currently present requested programme IDs, and every
-- successful source refresh replaces the source snapshot to clean stale/orphaned rows.

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
  unique (source, signal_type, source_item_id),
  constraint editorial_signal_source check (source = 'tvgids'),
  constraint editorial_signal_type check (signal_type = 'kijktip'),
  constraint editorial_signal_programme_nonempty check (length(btrim(programme_id)) > 0),
  constraint editorial_signal_source_item_nonempty check (length(btrim(source_item_id)) > 0),
  constraint editorial_signal_source_url_nonempty check (
    source_url is null or length(btrim(source_url)) > 0
  ),
  constraint editorial_signal_matched_by check (
    matched_by in ('source-id', 'channel-title-start', 'channel-exact-start')
  )
);

create table teevee.editorial_source_state (
  source text primary key,
  last_success_at timestamptz not null,
  signal_count integer not null check (signal_count >= 0),
  constraint editorial_source_state_source check (source = 'tvgids')
);

create index programme_editorial_signals_programme_idx
  on teevee.programme_editorial_signals(programme_id);

alter table teevee.programme_editorial_signals enable row level security;
alter table teevee.editorial_source_state enable row level security;

revoke all on teevee.programme_editorial_signals from public, anon, authenticated;
revoke all on teevee.editorial_source_state from public, anon, authenticated;
grant select, insert, update, delete on teevee.programme_editorial_signals to service_role;
grant select, insert, update, delete on teevee.editorial_source_state to service_role;

create or replace function teevee.replace_editorial_signal_snapshot(
  p_source text,
  p_refreshed_at timestamptz,
  p_signals jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_last_success_at timestamptz;
  v_removed integer := 0;
  v_stored integer := 0;
  v_invalid text;
begin
  if p_source is null or btrim(p_source) <> 'tvgids' then
    raise exception 'Unsupported editorial source';
  end if;
  if p_refreshed_at is null then
    raise exception 'refreshedAt must be a valid timestamp';
  end if;
  if jsonb_typeof(p_signals) is distinct from 'array' then
    raise exception 'signals must be a JSON array';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('teevee-editorial:' || p_source, 0)
  );

  select last_success_at
    into v_last_success_at
  from teevee.editorial_source_state
  where source = p_source;

  if v_last_success_at is not null and v_last_success_at > p_refreshed_at then
    return jsonb_build_object(
      'status', 'ignored-stale',
      'removedSignalCount', 0,
      'storedSignalCount', 0
    );
  end if;

  select s."programmeId"
    into v_invalid
  from jsonb_to_recordset(p_signals) as s(
    "programmeId" text,
    "type" text,
    source text,
    "sourceItemId" text,
    "sourceUrl" text,
    "publishedAt" timestamptz,
    "matchedBy" text
  )
  where
    s."programmeId" is null
    or length(btrim(s."programmeId")) = 0
    or s."type" is distinct from 'kijktip'
    or s.source is distinct from p_source
    or s."sourceItemId" is null
    or length(btrim(s."sourceItemId")) = 0
    or (s."sourceUrl" is not null and length(btrim(s."sourceUrl")) = 0)
    or s."matchedBy" not in ('source-id', 'channel-title-start', 'channel-exact-start')
  limit 1;
  if found then
    raise exception 'Editorial signal payload contains missing/invalid required fields';
  end if;

  select s."programmeId"
    into v_invalid
  from jsonb_to_recordset(p_signals) as s("programmeId" text)
  group by s."programmeId"
  having count(*) > 1
  limit 1;
  if v_invalid is not null then
    raise exception 'Duplicate editorial programme signal: %', v_invalid;
  end if;

  select s."sourceItemId"
    into v_invalid
  from jsonb_to_recordset(p_signals) as s("sourceItemId" text)
  group by s."sourceItemId"
  having count(*) > 1
  limit 1;
  if v_invalid is not null then
    raise exception 'Duplicate editorial source item: %', v_invalid;
  end if;

  select s."programmeId"
    into v_invalid
  from jsonb_to_recordset(p_signals) as s("programmeId" text)
  where not exists (
    select 1 from teevee.programmes p where p.id = s."programmeId"
  )
  limit 1;
  if v_invalid is not null then
    raise exception 'Editorial signal references unknown canonical programme %', v_invalid;
  end if;

  delete from teevee.programme_editorial_signals
  where source = p_source;
  get diagnostics v_removed = row_count;

  insert into teevee.programme_editorial_signals(
    source,
    signal_type,
    programme_id,
    source_item_id,
    source_url,
    published_at,
    matched_by,
    refreshed_at
  )
  select
    p_source,
    s."type",
    s."programmeId",
    s."sourceItemId",
    s."sourceUrl",
    s."publishedAt",
    s."matchedBy",
    p_refreshed_at
  from jsonb_to_recordset(p_signals) as s(
    "programmeId" text,
    "type" text,
    source text,
    "sourceItemId" text,
    "sourceUrl" text,
    "publishedAt" timestamptz,
    "matchedBy" text
  );
  get diagnostics v_stored = row_count;

  insert into teevee.editorial_source_state(source, last_success_at, signal_count)
  values (p_source, p_refreshed_at, v_stored)
  on conflict (source) do update
    set last_success_at = excluded.last_success_at,
        signal_count = excluded.signal_count;

  return jsonb_build_object(
    'status', 'stored',
    'removedSignalCount', v_removed,
    'storedSignalCount', v_stored
  );
end;
$$;

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
  if p_programme_ids is null or cardinality(p_programme_ids) = 0 then
    return '[]'::jsonb;
  end if;
  if exists (
    select 1 from unnest(p_programme_ids) value
    where value is null or length(btrim(value)) = 0
  ) then
    raise exception 'programmeIds must not contain blank values';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'programmeId', s.programme_id,
          'type', s.signal_type,
          'source', s.source,
          'sourceItemId', s.source_item_id,
          'sourceUrl', s.source_url,
          'publishedAt', s.published_at,
          'matchedBy', s.matched_by
        )
      )
      order by s.programme_id, s.signal_type, s.source, s.source_item_id
    ),
    '[]'::jsonb
  )
  into v_result
  from teevee.programme_editorial_signals s
  join teevee.programmes p on p.id = s.programme_id
  where s.programme_id = any(
    array(select distinct btrim(value) from unnest(p_programme_ids) value)
  );

  return v_result;
end;
$$;

create or replace function public.teevee_replace_editorial_signal_snapshot(
  p_source text,
  p_refreshed_at timestamptz,
  p_signals jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select teevee.replace_editorial_signal_snapshot(
    p_source,
    p_refreshed_at,
    p_signals
  );
$$;

create or replace function public.teevee_get_editorial_signals(
  p_programme_ids text[]
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select teevee.get_editorial_signals(p_programme_ids);
$$;

revoke execute on function teevee.replace_editorial_signal_snapshot(text,timestamptz,jsonb)
  from public, anon, authenticated;
revoke execute on function teevee.get_editorial_signals(text[])
  from public, anon, authenticated;
revoke execute on function public.teevee_replace_editorial_signal_snapshot(text,timestamptz,jsonb)
  from public, anon, authenticated;
revoke execute on function public.teevee_get_editorial_signals(text[])
  from public, anon, authenticated;

grant execute on function teevee.replace_editorial_signal_snapshot(text,timestamptz,jsonb)
  to service_role;
grant execute on function teevee.get_editorial_signals(text[])
  to service_role;
grant execute on function public.teevee_replace_editorial_signal_snapshot(text,timestamptz,jsonb)
  to service_role;
grant execute on function public.teevee_get_editorial_signals(text[])
  to service_role;

do $$
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'teevee_editorial_refresh_cron_token'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'teevee_editorial_refresh_cron_token',
      'Dedicated server-side token for the scheduled Teevee TVgids editorial refresh.'
    );
  end if;
end;
$$;

create or replace function public.teevee_validate_editorial_refresh_cron_token(
  p_token text
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_token is not null
    and length(p_token) > 0
    and exists (
      select 1
      from vault.decrypted_secrets
      where name = 'teevee_editorial_refresh_cron_token'
        and decrypted_secret = p_token
    );
$$;

revoke execute on function public.teevee_validate_editorial_refresh_cron_token(text)
  from public, anon, authenticated;
grant execute on function public.teevee_validate_editorial_refresh_cron_token(text)
  to service_role;

create or replace function teevee.enqueue_tvgids_editorial_refresh()
returns bigint[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  cron_token text;
  request_id bigint;
begin
  select decrypted_secret
    into cron_token
  from vault.decrypted_secrets
  where name = 'teevee_editorial_refresh_cron_token'
  order by updated_at desc
  limit 1;

  if cron_token is null or length(btrim(cron_token)) = 0 then
    return array[]::bigint[];
  end if;

  select net.http_post(
    url := 'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/editorial-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-teevee-editorial-cron-token', cron_token
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) into request_id;

  return array[request_id];
end;
$$;

create or replace function public.teevee_enqueue_tvgids_editorial_refresh()
returns bigint[]
language sql
security invoker
set search_path = ''
as $$
  select teevee.enqueue_tvgids_editorial_refresh();
$$;

revoke execute on function teevee.enqueue_tvgids_editorial_refresh()
  from public, anon, authenticated;
revoke execute on function public.teevee_enqueue_tvgids_editorial_refresh()
  from public, anon, authenticated;
grant execute on function teevee.enqueue_tvgids_editorial_refresh()
  to service_role;
grant execute on function public.teevee_enqueue_tvgids_editorial_refresh()
  to service_role;

select cron.schedule(
  'teevee-tvgids-editorial-refresh',
  '41 * * * *',
  $cron$select teevee.enqueue_tvgids_editorial_refresh();$cron$
);
