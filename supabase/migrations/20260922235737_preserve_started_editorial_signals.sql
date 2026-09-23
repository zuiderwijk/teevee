-- Preserve historical Kijktip metadata after a canonical broadcast has started.
--
-- The initial editorial store migration treated each successful RSS refresh as a
-- destructive source snapshot. That is correct for future source corrections, but
-- incorrect after a matched canonical programme has started: historical Kijktip
-- metadata belongs to that broadcast while the programme remains in retained
-- canonical schedule storage.
--
-- This forward migration changes only snapshot lifecycle semantics. Public/mobile
-- RPC payloads, advisory locking, stale-write protection, validation, the unique
-- source-item constraint and source identity stay unchanged.
--
-- It also performs one deliberately narrow recovery for direct tips.rss evidence
-- captured by PR #120. The recovery is NOT inferred from the URL/article itself:
-- the exact GUID/link + title + NPO 1 + 2026-09-22 21:30 CEST broadcast tuple was
-- present in the live tips.rss capture and matched the canonical broadcast with
-- zero start drift under the existing Tier-B confidence contract.

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

  -- Reconcile explicit source-item rekeys BEFORE incoming upsert. Canonical
  -- Programme IDs include start time, so a normal EPG start-time correction can
  -- rematch the same authoritative sourceItemId to a new programmeId. The source
  -- item is present, not omitted: it supersedes its prior canonical binding even
  -- when the old programme row is still retained.
  delete from teevee.programme_editorial_signals existing
  where existing.source = p_source
    and exists (
      select 1
      from jsonb_to_recordset(p_signals) as incoming(
        "programmeId" text,
        "type" text,
        "sourceItemId" text
      )
      where incoming."sourceItemId" = existing.source_item_id
        and incoming."type" = existing.signal_type
        and incoming."programmeId" is distinct from existing.programme_id
    );
  get diagnostics v_deleted = row_count;
  v_removed := v_removed + v_deleted;

  -- Schedule retention owns historical lifetime. Orphan cleanup must also happen
  -- before upsert so an obsolete canonical identity cannot retain source-item
  -- uniqueness and block a corrected incoming match.
  delete from teevee.programme_editorial_signals existing
  where existing.source = p_source
    and not exists (
      select 1
      from teevee.programmes p
      where p.id = existing.programme_id
    );
  get diagnostics v_deleted = row_count;
  v_removed := v_removed + v_deleted;

  -- A successful source snapshot may retract an omitted Kijktip only while the
  -- canonical broadcast is still in the future. Once start_at is reached, simple
  -- omission means historical retention; an explicit same-sourceItemId rekey was
  -- already reconciled above.
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

  -- All rows that can conflict on source-item identity have now been reconciled.
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

-- Conservative one-time recovery for already-deleted historical signals.
--
-- Evidence authority:
-- - PR #120 live tips.rss job 106846180653 captured the exact source item;
-- - job 106846829261 matched it with the existing Tier-B rule to the canonical
--   NPO 1 broadcast at 2026-09-22 19:30 UTC with zero start drift.
--
-- The URL happens to be under /nieuws/televisie/, but it is used here only because
-- that exact URL was the GUID/link of an explicit tips.rss item. General TVgids
-- news articles are not a Kijktip source.
--
-- Recovery deliberately re-runs a strict subset of Tier B: explicit channel,
-- exact source title, +/-5 minute start tolerance and exactly one retained
-- canonical candidate. Ambiguous/missing candidates fail closed. Existing
-- programme/source-item ownership also wins, making this block idempotent.
with recovery_evidence(
  source,
  signal_type,
  source_item_id,
  source_url,
  channel_id,
  source_title,
  source_start_at,
  published_at,
  evidence_captured_at
) as (
  values (
    'tvgids'::text,
    'kijktip'::text,
    'https://www.tvgids.nl/nieuws/televisie/de-slimste-mens-kiki-boreel-amusement-quiz-npo-1-2026-09-22'::text,
    'https://www.tvgids.nl/nieuws/televisie/de-slimste-mens-kiki-boreel-amusement-quiz-npo-1-2026-09-22'::text,
    'nl-npo-1'::text,
    'De slimste mens'::text,
    '2026-09-22T19:30:00Z'::timestamptz,
    '2026-09-21T20:15:00Z'::timestamptz,
    '2026-09-22T16:55:31.244Z'::timestamptz
  )
),
recovery_candidates as (
  select
    evidence.*,
    p.id as programme_id,
    count(*) over (
      partition by evidence.source, evidence.signal_type, evidence.source_item_id
    ) as candidate_count
  from recovery_evidence evidence
  join teevee.programmes p
    on p.channel_id = evidence.channel_id
   and p.title = evidence.source_title
   and p.start_at between
     evidence.source_start_at - interval '5 minutes'
     and evidence.source_start_at + interval '5 minutes'
  where p.start_at <= pg_catalog.now()
),
unique_recovery_candidates as (
  select *
  from recovery_candidates
  where candidate_count = 1
)
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
  candidate.source,
  candidate.signal_type,
  candidate.programme_id,
  candidate.source_item_id,
  candidate.source_url,
  candidate.published_at,
  'channel-title-start',
  candidate.evidence_captured_at
from unique_recovery_candidates candidate
where not exists (
  select 1
  from teevee.programme_editorial_signals existing
  where existing.source = candidate.source
    and existing.signal_type = candidate.signal_type
    and (
      existing.source_item_id = candidate.source_item_id
      or existing.programme_id = candidate.programme_id
    )
)
on conflict do nothing;

-- Keep freshness untouched, but make the diagnostic count accurate immediately
-- after an idempotent recovery insert.
update teevee.editorial_source_state state
set signal_count = (
  select count(*)::integer
  from teevee.programme_editorial_signals signal
  where signal.source = state.source
)
where state.source = 'tvgids';
