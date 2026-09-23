create table teevee.programme_classifications (
  programme_id text primary key references teevee.programmes(id) on update cascade on delete cascade,
  content_type text not null,
  series_type text not null,
  audience text not null,
  sport_type text not null,
  live_status text not null,
  repeat_status text not null,
  confidence text not null,
  classification_version integer not null,
  classified_at timestamptz not null,
  constraint programme_classifications_content_type check (
    content_type in ('film','series','sport','other','unknown')
  ),
  constraint programme_classifications_series_type check (
    series_type in ('scripted-episodic','non-scripted','unknown')
  ),
  constraint programme_classifications_audience check (
    audience in ('general-mainstream','primarily-children','unknown')
  ),
  constraint programme_classifications_sport_type check (
    sport_type in ('event','highlights','talk','magazine-documentary','other','unknown')
  ),
  constraint programme_classifications_live_status check (
    live_status in ('true','false','unknown')
  ),
  constraint programme_classifications_repeat_status check (
    repeat_status in ('true','false','unknown')
  ),
  constraint programme_classifications_confidence check (
    confidence in ('high','unknown')
  ),
  constraint programme_classifications_version_positive check (
    classification_version > 0
  )
);

alter table teevee.programme_classifications enable row level security;
revoke all on teevee.programme_classifications from public, anon, authenticated;
grant select, insert, update, delete on teevee.programme_classifications to service_role;

create or replace function teevee.replace_schedule_window_classified(
  p_from timestamptz,
  p_to timestamptz,
  p_generated_at timestamptz,
  p_channel_ids text[],
  p_channels jsonb,
  p_programmes jsonb,
  p_classifications jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_result jsonb;
  v_channel_ids text[];
  v_duplicate text;
  v_invalid text;
begin
  if jsonb_typeof(p_classifications) is distinct from 'array' then
    raise exception 'classifications must be a JSON array';
  end if;

  select c."programmeId"
    into v_duplicate
  from jsonb_to_recordset(p_classifications) as c("programmeId" text)
  group by c."programmeId"
  having count(*) > 1
  limit 1;
  if v_duplicate is not null then
    raise exception 'Duplicate programme classification id: %', v_duplicate;
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
    raise exception 'Programme classification payload contains missing/invalid fields';
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
    raise exception 'Classification references programme outside schedule payload: %', v_invalid;
  end if;

  if p_channel_ids is null or cardinality(p_channel_ids) = 0 then
    raise exception 'channelIds must contain at least one channel';
  end if;
  select array_agg(id order by id)
    into v_channel_ids
  from (
    select distinct btrim(value) as id
    from unnest(p_channel_ids) value
  ) ids;

  select p.id
    into v_invalid
  from jsonb_to_recordset(p_programmes) as p(
    id text,
    "channelId" text,
    "startAt" timestamptz,
    "endAt" timestamptz
  )
  where p."channelId" = any(v_channel_ids)
    and p."startAt" < p_to
    and p."endAt" > p_from
    and not exists (
      select 1
      from jsonb_to_recordset(p_classifications) as c("programmeId" text)
      where c."programmeId" = p.id
    )
  limit 1;
  if v_invalid is not null then
    raise exception 'Missing programme classification for %', v_invalid;
  end if;

  v_result := teevee.replace_schedule_window(
    p_from,
    p_to,
    p_generated_at,
    p_channel_ids,
    p_channels,
    p_programmes
  );

  if v_result->>'status' = 'ignored-stale' then
    return v_result;
  end if;

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
    c."programmeId",
    c."contentType",
    c."seriesType",
    c.audience,
    c."sportType",
    c."liveStatus",
    c."repeatStatus",
    c.confidence,
    1,
    p_generated_at
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
  join jsonb_to_recordset(p_programmes) as p(
    id text,
    "channelId" text,
    "startAt" timestamptz,
    "endAt" timestamptz
  ) on p.id = c."programmeId"
  where p."channelId" = any(v_channel_ids)
    and p."startAt" < p_to
    and p."endAt" > p_from
  on conflict (programme_id) do update
    set content_type = excluded.content_type,
        series_type = excluded.series_type,
        audience = excluded.audience,
        sport_type = excluded.sport_type,
        live_status = excluded.live_status,
        repeat_status = excluded.repeat_status,
        confidence = excluded.confidence,
        classification_version = excluded.classification_version,
        classified_at = excluded.classified_at;

  return v_result;
end;
$$;

create or replace function teevee.get_programme_classifications(
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
  if p_programme_ids is null
     or cardinality(p_programme_ids) = 0
     or cardinality(p_programme_ids) > 128 then
    raise exception 'programmeIds must contain 1..128 values';
  end if;
  if exists (
    select 1
    from unnest(p_programme_ids) value
    where length(btrim(value)) = 0
  ) then
    raise exception 'programmeIds must not contain blank values';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'programmeId', c.programme_id,
        'contentType', c.content_type,
        'seriesType', c.series_type,
        'audience', c.audience,
        'sportType', c.sport_type,
        'liveStatus', c.live_status,
        'repeatStatus', c.repeat_status,
        'confidence', c.confidence
      )
      order by p.start_at, c.programme_id
    ),
    '[]'::jsonb
  )
  into v_result
  from teevee.programme_classifications c
  join teevee.programmes p on p.id = c.programme_id
  where c.programme_id = any(p_programme_ids);

  return v_result;
end;
$$;

create or replace function public.teevee_replace_schedule_window_classified(
  p_from timestamptz,
  p_to timestamptz,
  p_generated_at timestamptz,
  p_channel_ids text[],
  p_channels jsonb,
  p_programmes jsonb,
  p_classifications jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select teevee.replace_schedule_window_classified(
    p_from,
    p_to,
    p_generated_at,
    p_channel_ids,
    p_channels,
    p_programmes,
    p_classifications
  );
$$;

create or replace function public.teevee_get_programme_classifications(
  p_programme_ids text[]
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select teevee.get_programme_classifications(p_programme_ids);
$$;

revoke execute on function teevee.replace_schedule_window_classified(
  timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb,jsonb
) from public, anon, authenticated;
revoke execute on function teevee.get_programme_classifications(text[])
  from public, anon, authenticated;
revoke execute on function public.teevee_replace_schedule_window_classified(
  timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb,jsonb
) from public, anon, authenticated;
revoke execute on function public.teevee_get_programme_classifications(text[])
  from public, anon, authenticated;

grant execute on function teevee.replace_schedule_window_classified(
  timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb,jsonb
) to service_role;
grant execute on function teevee.get_programme_classifications(text[]) to service_role;
grant execute on function public.teevee_replace_schedule_window_classified(
  timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb,jsonb
) to service_role;
grant execute on function public.teevee_get_programme_classifications(text[]) to service_role;
