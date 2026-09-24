create table teevee.programme_external_content_references (
  programme_id text primary key,
  source text not null,
  media_type text not null,
  external_content_id text not null,
  confidence text not null,
  matcher_version integer not null,
  evidence_observed_at timestamptz not null,
  resolved_at timestamptz not null,
  constraint programme_external_content_source check (source = 'tmdb'),
  constraint programme_external_content_media_type check (media_type in ('film','series')),
  constraint programme_external_content_id check (external_content_id ~ '^[1-9][0-9]*$'),
  constraint programme_external_content_confidence check (confidence = 'high'),
  constraint programme_external_content_matcher_version check (matcher_version > 0)
);

alter table teevee.programme_external_content_references enable row level security;
revoke all on teevee.programme_external_content_references from public, anon, authenticated;
grant select, insert, update, delete on teevee.programme_external_content_references to service_role;

-- ADR 0007 deliberately replaces schedule windows by deleting and reinserting
-- canonical programme rows. A cascading FK would therefore erase a correct
-- forward-filled identity during every normal refresh. Keep the sibling private
-- and enforce programme ownership with triggers that understand that lifecycle.
create or replace function teevee.assert_programme_external_content_reference_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $owner_assert$
begin
  if not exists (
    select 1
    from teevee.programmes p
    where p.id = new.programme_id
  ) then
    raise exception 'External-content reference points to unknown canonical programme %',
      new.programme_id;
  end if;
  return new;
end;
$owner_assert$;

create trigger programme_external_content_reference_owner_before_write
before insert or update of programme_id
on teevee.programme_external_content_references
for each row
execute function teevee.assert_programme_external_content_reference_owner();

-- Defer programme-side cleanup until transaction end. Normal schedule replacement
-- has reinserted an unchanged concrete broadcast by then, so its identity survives.
-- A true delete/rekey/correction has no exact old broadcast tuple at commit and the
-- old reference is removed before the transaction becomes externally visible.
create or replace function teevee.cleanup_programme_external_content_reference_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $owner_cleanup$
begin
  if exists (
    select 1
    from teevee.programmes p
    where p.id = old.id
      and p.channel_id = old.channel_id
      and p.start_at = old.start_at
      and p.end_at = old.end_at
      and p.title = old.title
  ) then
    return null;
  end if;

  delete from teevee.programme_external_content_references existing
  where existing.programme_id = old.id;

  return null;
end;
$owner_cleanup$;

create constraint trigger programme_external_content_reference_programme_ownership
after delete or update
on teevee.programmes
deferrable initially deferred
for each row
execute function teevee.cleanup_programme_external_content_reference_owner();

revoke execute on function teevee.assert_programme_external_content_reference_owner()
  from public, anon, authenticated;
revoke execute on function teevee.cleanup_programme_external_content_reference_owner()
  from public, anon, authenticated;
grant execute on function teevee.assert_programme_external_content_reference_owner()
  to service_role;
grant execute on function teevee.cleanup_programme_external_content_reference_owner()
  to service_role;

create or replace function teevee.apply_programme_external_content_decisions(
  p_observed_at timestamptz,
  p_resolved_at timestamptz,
  p_decisions jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_channel_id text;
  v_decision_count integer := 0;
  v_current_count integer := 0;
  v_resolved_count integer := 0;
  v_cleared_count integer := 0;
  v_duplicate text;
  v_invalid text;
begin
  if p_observed_at is null then
    raise exception 'observedAt must be a valid timestamp';
  end if;
  if p_resolved_at is null then
    raise exception 'resolvedAt must be a valid timestamp';
  end if;
  if jsonb_typeof(p_decisions) is distinct from 'array'
     or jsonb_array_length(p_decisions) < 1
     or jsonb_array_length(p_decisions) > 256 then
    raise exception 'decisions must contain 1..256 values';
  end if;

  v_decision_count := jsonb_array_length(p_decisions);

  select d."programmeId"
    into v_duplicate
  from jsonb_to_recordset(p_decisions) as d("programmeId" text)
  group by d."programmeId"
  having count(*) > 1
  limit 1;
  if v_duplicate is not null then
    raise exception 'Duplicate external-content programme decision: %', v_duplicate;
  end if;

  select d."programmeId"
    into v_invalid
  from jsonb_to_recordset(p_decisions) as d(
    "programmeId" text,
    "channelId" text,
    "startAt" timestamptz,
    "endAt" timestamptz,
    title text,
    status text,
    source text,
    "mediaType" text,
    "externalContentId" text,
    confidence text,
    "matcherVersion" integer
  )
  where
    d."programmeId" is null
    or length(btrim(d."programmeId")) = 0
    or d."channelId" is null
    or length(btrim(d."channelId")) = 0
    or d."startAt" is null
    or d."endAt" is null
    or d."endAt" <= d."startAt"
    or d.title is null
    or length(btrim(d.title)) = 0
    or d.status not in ('resolved','unresolved','ambiguous')
    or (
      d.status = 'resolved'
      and (
        d.source is distinct from 'tmdb'
        or d."mediaType" not in ('film','series')
        or d."externalContentId" is null
        or d."externalContentId" !~ '^[1-9][0-9]*$'
        or d.confidence is distinct from 'high'
        or d."matcherVersion" is null
        or d."matcherVersion" <= 0
      )
    )
    or (
      d.status <> 'resolved'
      and (
        d.source is not null
        or d."mediaType" is not null
        or d."externalContentId" is not null
        or d.confidence is not null
        or d."matcherVersion" is not null
      )
    )
  limit 1;
  if found then
    raise exception 'External-content decision payload contains missing/invalid fields';
  end if;

  -- Use the same per-channel transaction lock as canonical schedule replacement.
  -- A late matcher therefore cannot pass its exact-broadcast/freshness check while
  -- a newer authoritative schedule correction is concurrently rekeying that row.
  for v_channel_id in
    select distinct btrim(d."channelId")
    from jsonb_to_recordset(p_decisions) as d("channelId" text)
    order by 1
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_channel_id, 0)
    );
  end loop;

  -- A decision is current only when all three ownership conditions hold:
  -- 1) the exact concrete canonical broadcast still exists;
  -- 2) schedule coverage proves that exact provider observation was authoritative;
  -- 3) neither schedule coverage nor an existing identity decision is newer.
  with decisions as (
    select *
    from jsonb_to_recordset(p_decisions) as d(
      "programmeId" text,
      "channelId" text,
      "startAt" timestamptz,
      "endAt" timestamptz,
      title text,
      status text,
      source text,
      "mediaType" text,
      "externalContentId" text,
      confidence text,
      "matcherVersion" integer
    )
  ),
  current_decisions as (
    select d.*
    from decisions d
    join teevee.programmes p
      on p.id = d."programmeId"
     and p.channel_id = d."channelId"
     and p.start_at = d."startAt"
     and p.end_at = d."endAt"
     and p.title = d.title
    where exists (
      select 1
      from teevee.schedule_coverage coverage
      where coverage.channel_id = p.channel_id
        and coverage.coverage_range && p.airing
        and coverage.generated_at = p_observed_at
    )
    and not exists (
      select 1
      from teevee.schedule_coverage coverage
      where coverage.channel_id = p.channel_id
        and coverage.coverage_range && p.airing
        and coverage.generated_at > p_observed_at
    )
    and not exists (
      select 1
      from teevee.programme_external_content_references existing
      where existing.programme_id = p.id
        and existing.evidence_observed_at > p_observed_at
    )
  )
  select count(*)::integer
    into v_current_count
  from current_decisions;

  with decisions as (
    select *
    from jsonb_to_recordset(p_decisions) as d(
      "programmeId" text,
      "channelId" text,
      "startAt" timestamptz,
      "endAt" timestamptz,
      title text,
      status text
    )
  ),
  current_negative_decisions as (
    select d."programmeId"
    from decisions d
    join teevee.programmes p
      on p.id = d."programmeId"
     and p.channel_id = d."channelId"
     and p.start_at = d."startAt"
     and p.end_at = d."endAt"
     and p.title = d.title
    where d.status in ('unresolved','ambiguous')
      and exists (
        select 1
        from teevee.schedule_coverage coverage
        where coverage.channel_id = p.channel_id
          and coverage.coverage_range && p.airing
          and coverage.generated_at = p_observed_at
      )
      and not exists (
        select 1
        from teevee.schedule_coverage coverage
        where coverage.channel_id = p.channel_id
          and coverage.coverage_range && p.airing
          and coverage.generated_at > p_observed_at
      )
      and not exists (
        select 1
        from teevee.programme_external_content_references existing
        where existing.programme_id = p.id
          and existing.evidence_observed_at > p_observed_at
      )
  )
  delete from teevee.programme_external_content_references existing
  using current_negative_decisions negative
  where existing.programme_id = negative."programmeId"
    and existing.evidence_observed_at <= p_observed_at;
  get diagnostics v_cleared_count = row_count;

  with decisions as (
    select *
    from jsonb_to_recordset(p_decisions) as d(
      "programmeId" text,
      "channelId" text,
      "startAt" timestamptz,
      "endAt" timestamptz,
      title text,
      status text,
      source text,
      "mediaType" text,
      "externalContentId" text,
      confidence text,
      "matcherVersion" integer
    )
  ),
  current_resolved_decisions as (
    select d.*
    from decisions d
    join teevee.programmes p
      on p.id = d."programmeId"
     and p.channel_id = d."channelId"
     and p.start_at = d."startAt"
     and p.end_at = d."endAt"
     and p.title = d.title
    where d.status = 'resolved'
      and exists (
        select 1
        from teevee.schedule_coverage coverage
        where coverage.channel_id = p.channel_id
          and coverage.coverage_range && p.airing
          and coverage.generated_at = p_observed_at
      )
      and not exists (
        select 1
        from teevee.schedule_coverage coverage
        where coverage.channel_id = p.channel_id
          and coverage.coverage_range && p.airing
          and coverage.generated_at > p_observed_at
      )
      and not exists (
        select 1
        from teevee.programme_external_content_references existing
        where existing.programme_id = p.id
          and existing.evidence_observed_at > p_observed_at
      )
  )
  insert into teevee.programme_external_content_references(
    programme_id,
    source,
    media_type,
    external_content_id,
    confidence,
    matcher_version,
    evidence_observed_at,
    resolved_at
  )
  select
    d."programmeId",
    d.source,
    d."mediaType",
    d."externalContentId",
    d.confidence,
    d."matcherVersion",
    p_observed_at,
    p_resolved_at
  from current_resolved_decisions d
  on conflict (programme_id) do update
    set source = excluded.source,
        media_type = excluded.media_type,
        external_content_id = excluded.external_content_id,
        confidence = excluded.confidence,
        matcher_version = excluded.matcher_version,
        evidence_observed_at = excluded.evidence_observed_at,
        resolved_at = excluded.resolved_at
    where teevee.programme_external_content_references.evidence_observed_at <=
          excluded.evidence_observed_at;
  get diagnostics v_resolved_count = row_count;

  return jsonb_build_object(
    'decisionCount', v_decision_count,
    'resolvedReferenceCount', v_resolved_count,
    'clearedReferenceCount', v_cleared_count,
    'ignoredStaleCount', v_decision_count - v_current_count
  );
end;
$$;

create or replace function public.teevee_apply_programme_external_content_decisions(
  p_observed_at timestamptz,
  p_resolved_at timestamptz,
  p_decisions jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select teevee.apply_programme_external_content_decisions(
    p_observed_at,
    p_resolved_at,
    p_decisions
  );
$$;

revoke execute on function teevee.apply_programme_external_content_decisions(
  timestamptz,timestamptz,jsonb
) from public, anon, authenticated;
revoke execute on function public.teevee_apply_programme_external_content_decisions(
  timestamptz,timestamptz,jsonb
) from public, anon, authenticated;

grant execute on function teevee.apply_programme_external_content_decisions(
  timestamptz,timestamptz,jsonb
) to service_role;
grant execute on function public.teevee_apply_programme_external_content_decisions(
  timestamptz,timestamptz,jsonb
) to service_role;
