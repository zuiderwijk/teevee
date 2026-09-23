create or replace function teevee.recover_programme_classifications(
  p_from timestamptz,
  p_to timestamptz,
  p_observed_at timestamptz,
  p_channel_ids text[],
  p_programmes jsonb,
  p_classifications jsonb
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
  v_candidate_count integer := 0;
  v_matched_count integer := 0;
  v_recovered_count integer := 0;
  v_stale_count integer := 0;
begin
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'to must be after from';
  end if;
  if p_observed_at is null then
    raise exception 'observedAt must be a valid timestamp';
  end if;
  if p_channel_ids is null or cardinality(p_channel_ids) = 0 then
    raise exception 'channelIds must contain at least one channel';
  end if;
  if exists (
    select 1
    from unnest(p_channel_ids) value
    where length(btrim(value)) = 0
  ) then
    raise exception 'channelIds must not contain blank values';
  end if;
  if jsonb_typeof(p_programmes) is distinct from 'array' then
    raise exception 'programmes must be a JSON array';
  end if;
  if jsonb_typeof(p_classifications) is distinct from 'array' then
    raise exception 'classifications must be a JSON array';
  end if;

  select array_agg(id order by id)
    into v_channel_ids
  from (
    select distinct btrim(value) as id
    from unnest(p_channel_ids) value
  ) ids;

  select p.id
    into v_duplicate
  from jsonb_to_recordset(p_programmes) as p(id text)
  group by p.id
  having count(*) > 1
  limit 1;
  if v_duplicate is not null then
    raise exception 'Duplicate recovery programme id: %', v_duplicate;
  end if;

  select p.id
    into v_invalid
  from jsonb_to_recordset(p_programmes) as p(
    id text,
    "channelId" text,
    "startAt" timestamptz,
    "endAt" timestamptz,
    title text
  )
  where
    p.id is null
    or length(btrim(p.id)) = 0
    or p."channelId" is null
    or length(btrim(p."channelId")) = 0
    or p."startAt" is null
    or p."endAt" is null
    or p."endAt" <= p."startAt"
    or p.title is null
    or length(btrim(p.title)) = 0
  limit 1;
  if found then
    raise exception 'Recovery programme payload contains missing/invalid required fields';
  end if;

  select p.id
    into v_invalid
  from jsonb_to_recordset(p_programmes) as p(
    id text,
    "channelId" text,
    "startAt" timestamptz,
    "endAt" timestamptz,
    title text
  )
  where
    not (p."channelId" = any(v_channel_ids))
    or p."startAt" >= p_to
    or p."endAt" <= p_from
  limit 1;
  if v_invalid is not null then
    raise exception 'Recovery programme is outside requested scope: %', v_invalid;
  end if;

  select c."programmeId"
    into v_duplicate
  from jsonb_to_recordset(p_classifications) as c("programmeId" text)
  group by c."programmeId"
  having count(*) > 1
  limit 1;
  if v_duplicate is not null then
    raise exception 'Duplicate recovery classification id: %', v_duplicate;
  end if;

  select c."programmeId"
    into v_invalid
  from jsonb_to_recordset(p_classifications) as c(
    "programmeId" text,
    "contentType" text,
    "seriesType" text,
    audience text,
    "sportType" text,
    "liveStatus" text,
    "repeatStatus" text,
    confidence text
  )
  where
    c."programmeId" is null
    or length(btrim(c."programmeId")) = 0
    or c."contentType" is null
    or c."contentType" not in ('film','series','sport','other','unknown')
    or c."seriesType" is null
    or c."seriesType" not in ('scripted-episodic','non-scripted','unknown')
    or c.audience is null
    or c.audience not in ('general-mainstream','primarily-children','unknown')
    or c."sportType" is null
    or c."sportType" not in ('event','highlights','talk','magazine-documentary','other','unknown')
    or c."liveStatus" is null
    or c."liveStatus" not in ('true','false','unknown')
    or c."repeatStatus" is null
    or c."repeatStatus" not in ('true','false','unknown')
    or c.confidence is null
    or c.confidence not in ('high','unknown')
  limit 1;
  if found then
    raise exception 'Recovery classification payload contains missing/invalid fields';
  end if;

  select c."programmeId"
    into v_invalid
  from jsonb_to_recordset(p_classifications) as c("programmeId" text)
  where not exists (
    select 1
    from jsonb_to_recordset(p_programmes) as p(id text)
    where p.id = c."programmeId"
  )
  limit 1;
  if v_invalid is not null then
    raise exception 'Recovery classification references programme outside payload: %', v_invalid;
  end if;

  select p.id
    into v_invalid
  from jsonb_to_recordset(p_programmes) as p(id text)
  where not exists (
    select 1
    from jsonb_to_recordset(p_classifications) as c("programmeId" text)
    where c."programmeId" = p.id
  )
  limit 1;
  if v_invalid is not null then
    raise exception 'Missing recovery classification for %', v_invalid;
  end if;

  foreach v_channel_id in array v_channel_ids loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_channel_id, 0)
    );
  end loop;

  v_candidate_count := jsonb_array_length(p_programmes);

  select count(*)
    into v_matched_count
  from jsonb_to_recordset(p_programmes) as candidate(
    id text,
    "channelId" text,
    "startAt" timestamptz,
    "endAt" timestamptz,
    title text
  )
  join teevee.programmes existing
    on existing.id = candidate.id
   and existing.channel_id = candidate."channelId"
   and existing.start_at = candidate."startAt"
   and existing.end_at = candidate."endAt"
   and existing.title = candidate.title;

  select count(*)
    into v_stale_count
  from jsonb_to_recordset(p_programmes) as candidate(
    id text,
    "channelId" text,
    "startAt" timestamptz,
    "endAt" timestamptz,
    title text
  )
  join teevee.programmes existing
    on existing.id = candidate.id
   and existing.channel_id = candidate."channelId"
   and existing.start_at = candidate."startAt"
   and existing.end_at = candidate."endAt"
   and existing.title = candidate.title
  where
    exists (
      select 1
      from teevee.schedule_coverage coverage
      where coverage.channel_id = existing.channel_id
        and coverage.coverage_range &&
          tstzrange(existing.start_at, existing.end_at, '[)')
        and coverage.generated_at > p_observed_at
    )
    or exists (
      select 1
      from teevee.programme_classifications current_classification
      where current_classification.programme_id = existing.id
        and current_classification.classified_at > p_observed_at
    );

  insert into teevee.programme_classifications(
    programme_id,
    content_type,
    series_type,
    audience,
    sport_type,
    live_status,
    repeat_status,
    confidence,
    classification_version,
    classified_at
  )
  select
    classification."programmeId",
    classification."contentType",
    classification."seriesType",
    classification.audience,
    classification."sportType",
    classification."liveStatus",
    classification."repeatStatus",
    classification.confidence,
    1,
    p_observed_at
  from jsonb_to_recordset(p_programmes) as candidate(
    id text,
    "channelId" text,
    "startAt" timestamptz,
    "endAt" timestamptz,
    title text
  )
  join jsonb_to_recordset(p_classifications) as classification(
    "programmeId" text,
    "contentType" text,
    "seriesType" text,
    audience text,
    "sportType" text,
    "liveStatus" text,
    "repeatStatus" text,
    confidence text
  ) on classification."programmeId" = candidate.id
  join teevee.programmes existing
    on existing.id = candidate.id
   and existing.channel_id = candidate."channelId"
   and existing.start_at = candidate."startAt"
   and existing.end_at = candidate."endAt"
   and existing.title = candidate.title
  where not exists (
    select 1
    from teevee.schedule_coverage coverage
    where coverage.channel_id = existing.channel_id
      and coverage.coverage_range &&
        tstzrange(existing.start_at, existing.end_at, '[)')
      and coverage.generated_at > p_observed_at
  )
  and not exists (
    select 1
    from teevee.programme_classifications current_classification
    where current_classification.programme_id = existing.id
      and current_classification.classified_at > p_observed_at
  )
  on conflict (programme_id) do update
    set content_type = excluded.content_type,
        series_type = excluded.series_type,
        audience = excluded.audience,
        sport_type = excluded.sport_type,
        live_status = excluded.live_status,
        repeat_status = excluded.repeat_status,
        confidence = excluded.confidence,
        classification_version = excluded.classification_version,
        classified_at = excluded.classified_at
    where teevee.programme_classifications.classified_at <= excluded.classified_at;

  get diagnostics v_recovered_count = row_count;

  return jsonb_build_object(
    'candidateProgrammeCount', v_candidate_count,
    'matchedProgrammeCount', v_matched_count,
    'recoveredClassificationCount', v_recovered_count,
    'ignoredStaleCount', v_stale_count,
    'unmatchedProgrammeCount', v_candidate_count - v_matched_count
  );
end;
$$;

create or replace function public.teevee_recover_programme_classifications(
  p_from timestamptz,
  p_to timestamptz,
  p_observed_at timestamptz,
  p_channel_ids text[],
  p_programmes jsonb,
  p_classifications jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select teevee.recover_programme_classifications(
    p_from,
    p_to,
    p_observed_at,
    p_channel_ids,
    p_programmes,
    p_classifications
  );
$$;

revoke execute on function teevee.recover_programme_classifications(
  timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb
) from public, anon, authenticated;
revoke execute on function public.teevee_recover_programme_classifications(
  timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb
) from public, anon, authenticated;

grant execute on function teevee.recover_programme_classifications(
  timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb
) to service_role;
grant execute on function public.teevee_recover_programme_classifications(
  timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb
) to service_role;
