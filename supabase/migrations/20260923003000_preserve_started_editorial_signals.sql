-- Preserve historical Kijktip metadata after a canonical broadcast has started.
--
-- The initial editorial store migration treated each successful RSS refresh as a
-- destructive source snapshot. That is correct for future source corrections, but
-- incorrect after a matched canonical programme has started: historical Kijktip
-- metadata belongs to that broadcast while the programme remains in retained
-- canonical schedule storage.
--
-- This forward migration changes only snapshot lifecycle semantics. Public/mobile
-- RPC payloads, advisory locking, stale-write protection, validation and source
-- identity stay unchanged.

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
  v_deleted integer := 0;
  v_stored integer := 0;
  v_signal_count integer := 0;
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
  )
  on conflict (source, signal_type, programme_id) do update
    set source_item_id = excluded.source_item_id,
        source_url = excluded.source_url,
        published_at = excluded.published_at,
        matched_by = excluded.matched_by,
        refreshed_at = excluded.refreshed_at;
  get diagnostics v_stored = row_count;

  -- A successful source snapshot may retract an omitted Kijktip only while the
  -- canonical broadcast is still in the future. Once start_at is reached, the
  -- broadcast's editorial designation is historical metadata and survives RSS
  -- rotation for as long as that programme remains retained canonically.
  delete from teevee.programme_editorial_signals existing
  using teevee.programmes p
  where existing.source = p_source
    and p.id = existing.programme_id
    and p.start_at > p_refreshed_at
    and not exists (
      select 1
      from jsonb_to_recordset(p_signals) as incoming(
        "programmeId" text,
        "type" text
      )
      where incoming."programmeId" = existing.programme_id
        and incoming."type" = existing.signal_type
    );
  get diagnostics v_deleted = row_count;
  v_removed := v_removed + v_deleted;

  -- Schedule retention owns historical lifetime. Remove orphaned editorial rows
  -- only after their canonical programme has left retained schedule storage.
  delete from teevee.programme_editorial_signals existing
  where existing.source = p_source
    and not exists (
      select 1
      from teevee.programmes p
      where p.id = existing.programme_id
    );
  get diagnostics v_deleted = row_count;
  v_removed := v_removed + v_deleted;

  select count(*)::integer
    into v_signal_count
  from teevee.programme_editorial_signals
  where source = p_source;

  insert into teevee.editorial_source_state(source, last_success_at, signal_count)
  values (p_source, p_refreshed_at, v_signal_count)
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

revoke execute on function teevee.replace_editorial_signal_snapshot(text,timestamptz,jsonb)
  from public, anon, authenticated;
grant execute on function teevee.replace_editorial_signal_snapshot(text,timestamptz,jsonb)
  to service_role;
