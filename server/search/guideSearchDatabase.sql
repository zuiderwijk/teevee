-- Phase 5A Guide Search canonical-store read boundary.
--
-- This SQL is intentionally kept as an exact deployment source until the reviewed
-- architecture PR is merged. Deployment records the Supabase-generated migration
-- version, after which the same byte-reviewed SQL is moved into canonical migration
-- history. No Search table, materialized index or provider-specific identity is added.

create extension if not exists unaccent with schema extensions;

create or replace function teevee.normalize_search_text(
  p_value text
) returns text
language sql
stable
strict
security invoker
set search_path = ''
as $$
  select pg_catalog.regexp_replace(
    pg_catalog.btrim(
      pg_catalog.regexp_replace(
        pg_catalog.regexp_replace(
          pg_catalog.regexp_replace(
            pg_catalog.lower(extensions.unaccent(p_value)),
            '[’''`´]',
            '',
            'g'
          ),
          '&',
          ' en ',
          'g'
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ),
    '[[:space:]]+',
    ' ',
    'g'
  );
$$;

create or replace function teevee.search_guide(
  p_query text,
  p_now timestamptz,
  p_windows jsonb,
  p_programme_limit integer default 24,
  p_channel_limit integer default 24
) returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_query text;
  v_window_count integer;
  v_channel_count integer;
  v_covered_window_count integer;
  v_programme_coverage text;
  v_channel_matches jsonb;
  v_programme_matches jsonb;
begin
  if p_query is null then
    raise exception 'query must not be null';
  end if;
  v_query := teevee.normalize_search_text(p_query);
  if length(v_query) < 2 or length(v_query) > 80 then
    raise exception 'query must contain 2..80 searchable characters';
  end if;
  if p_now is null then
    raise exception 'now must be a valid timestamp';
  end if;
  if jsonb_typeof(p_windows) is distinct from 'array' then
    raise exception 'windows must be a JSON array';
  end if;
  v_window_count := jsonb_array_length(p_windows);
  if v_window_count <> 10 then
    raise exception 'Guide Search requires exactly 10 television-day windows';
  end if;
  if p_programme_limit is null or p_programme_limit < 1 or p_programme_limit > 100 then
    raise exception 'programmeLimit must be 1..100';
  end if;
  if p_channel_limit is null or p_channel_limit < 1 or p_channel_limit > 100 then
    raise exception 'channelLimit must be 1..100';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_windows) item
    where jsonb_typeof(item) is distinct from 'object'
      or not (item ? 'from')
      or not (item ? 'to')
      or jsonb_typeof(item->'from') is distinct from 'string'
      or jsonb_typeof(item->'to') is distinct from 'string'
  ) then
    raise exception 'windows must contain from/to timestamp strings';
  end if;

  if exists (
    with windows as (
      select
        ordinality::integer as ordinal,
        (item->>'from')::timestamptz as from_at,
        (item->>'to')::timestamptz as to_at
      from jsonb_array_elements(p_windows) with ordinality as input(item, ordinality)
    )
    select 1
    from windows
    where to_at <= from_at
  ) then
    raise exception 'window to must be after from';
  end if;

  if exists (
    with windows as (
      select
        ordinality::integer as ordinal,
        (item->>'from')::timestamptz as from_at,
        (item->>'to')::timestamptz as to_at
      from jsonb_array_elements(p_windows) with ordinality as input(item, ordinality)
    )
    select 1
    from windows current_window
    join windows next_window
      on next_window.ordinal = current_window.ordinal + 1
    where current_window.to_at <> next_window.from_at
  ) then
    raise exception 'Guide Search windows must be contiguous';
  end if;

  select count(*)::integer
    into v_channel_count
  from teevee.channels;

  with windows as (
    select
      ordinality::integer as ordinal,
      (item->>'from')::timestamptz as from_at,
      (item->>'to')::timestamptz as to_at
    from jsonb_array_elements(p_windows) with ordinality as input(item, ordinality)
  ),
  covered_windows as (
    select window.ordinal
    from windows window
    where v_channel_count > 0
      and (
        select count(*)::integer
        from teevee.channels channel
        where coalesce((
          select sum(
            extract(epoch from (
              least(coverage.to_at, window.to_at)
              - greatest(coverage.from_at, window.from_at)
            ))
          )
          from teevee.schedule_coverage coverage
          where coverage.channel_id = channel.id
            and coverage.coverage_range
              && tstzrange(window.from_at, window.to_at, '[)')
        ), 0) >= extract(epoch from (window.to_at - window.from_at))
      ) = v_channel_count
  )
  select count(*)::integer
    into v_covered_window_count
  from covered_windows;

  v_programme_coverage := case
    when v_covered_window_count = 0 then 'unavailable'
    when v_covered_window_count = v_window_count then 'complete'
    else 'partial'
  end;

  with channel_candidates as (
    select
      channel.*,
      match.match_rank
    from teevee.channels channel
    cross join lateral (
      select min(candidate.match_rank) as match_rank
      from (
        select case
          when normalized.value = v_query then 0
          when pg_catalog.strpos(normalized.value, v_query) = 1 then 1
          when pg_catalog.strpos(normalized.value, v_query) > 0 then 2
          else null
        end as match_rank
        from (
          values
            (teevee.normalize_search_text(channel.display_name)),
            (teevee.normalize_search_text(channel.name)),
            (case
              when channel.short_name is null then null
              else teevee.normalize_search_text(channel.short_name)
            end)
        ) normalized(value)
        where normalized.value is not null
      ) candidate
    ) match
    where match.match_rank is not null
    order by match.match_rank, channel.sort_order, channel.id
    limit p_channel_limit
  )
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', id,
          'name', name,
          'displayName', display_name,
          'sortOrder', sort_order,
          'isActive', is_active,
          'shortName', short_name,
          'logoUrl', logo_url
        )
      )
      order by match_rank, sort_order, id
    ),
    '[]'::jsonb
  )
  into v_channel_matches
  from channel_candidates;

  with windows as (
    select
      ordinality::integer as ordinal,
      (item->>'from')::timestamptz as from_at,
      (item->>'to')::timestamptz as to_at
    from jsonb_array_elements(p_windows) with ordinality as input(item, ordinality)
  ),
  covered_windows as (
    select window.ordinal, window.from_at, window.to_at
    from windows window
    where v_channel_count > 0
      and (
        select count(*)::integer
        from teevee.channels channel
        where coalesce((
          select sum(
            extract(epoch from (
              least(coverage.to_at, window.to_at)
              - greatest(coverage.from_at, window.from_at)
            ))
          )
          from teevee.schedule_coverage coverage
          where coverage.channel_id = channel.id
            and coverage.coverage_range
              && tstzrange(window.from_at, window.to_at, '[)')
        ), 0) >= extract(epoch from (window.to_at - window.from_at))
      ) = v_channel_count
  ),
  candidates as (
    select
      programme.*,
      channel.name as channel_name,
      channel.display_name as channel_display_name,
      channel.sort_order as channel_sort_order,
      channel.is_active as channel_is_active,
      channel.short_name as channel_short_name,
      channel.logo_url as channel_logo_url,
      teevee.normalize_search_text(programme.title) as normalized_title
    from teevee.programmes programme
    join teevee.channels channel on channel.id = programme.channel_id
    where exists (
      select 1
      from covered_windows window
      where programme.start_at < window.to_at
        and programme.end_at > window.from_at
    )
  ),
  ranked as (
    select
      candidates.*,
      case
        when normalized_title = v_query then 0
        when pg_catalog.strpos(normalized_title, v_query) = 1 then 1
        when pg_catalog.strpos(normalized_title, v_query) > 0 then 2
        else null
      end as match_rank,
      case
        when start_at <= p_now and p_now < end_at then 0
        when start_at >= p_now then 1
        else 2
      end as temporal_rank
    from candidates
    where pg_catalog.strpos(normalized_title, v_query) > 0
  ),
  limited as (
    select *
    from ranked
    order by
      match_rank,
      temporal_rank,
      case when temporal_rank < 2 then start_at end asc nulls last,
      case when temporal_rank = 2 then start_at end desc nulls last,
      channel_sort_order,
      id
    limit p_programme_limit
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'programme',
        jsonb_strip_nulls(
          jsonb_build_object(
            'id', id,
            'channelId', channel_id,
            'startAt', start_at,
            'endAt', end_at,
            'title', title,
            'subtitle', subtitle,
            'description', description,
            'genre', genre,
            'isLive', is_live,
            'isRepeat', is_repeat
          )
        ),
        'channel',
        jsonb_strip_nulls(
          jsonb_build_object(
            'id', channel_id,
            'name', channel_name,
            'displayName', channel_display_name,
            'sortOrder', channel_sort_order,
            'isActive', channel_is_active,
            'shortName', channel_short_name,
            'logoUrl', channel_logo_url
          )
        )
      )
      order by
        match_rank,
        temporal_rank,
        case when temporal_rank < 2 then start_at end asc nulls last,
        case when temporal_rank = 2 then start_at end desc nulls last,
        channel_sort_order,
        id
    ),
    '[]'::jsonb
  )
  into v_programme_matches
  from limited;

  return jsonb_build_object(
    'programmeCoverage', v_programme_coverage,
    'channelMatches', v_channel_matches,
    'programmeMatches', v_programme_matches
  );
end;
$$;

create or replace function public.teevee_search_guide(
  p_query text,
  p_now timestamptz,
  p_windows jsonb,
  p_programme_limit integer default 24,
  p_channel_limit integer default 24
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select teevee.search_guide(
    p_query,
    p_now,
    p_windows,
    p_programme_limit,
    p_channel_limit
  );
$$;

revoke execute on function teevee.normalize_search_text(text)
  from public, anon, authenticated;
revoke execute on function teevee.search_guide(text,timestamptz,jsonb,integer,integer)
  from public, anon, authenticated;
revoke execute on function public.teevee_search_guide(text,timestamptz,jsonb,integer,integer)
  from public, anon, authenticated;

grant execute on function teevee.normalize_search_text(text)
  to service_role;
grant execute on function teevee.search_guide(text,timestamptz,jsonb,integer,integer)
  to service_role;
grant execute on function public.teevee_search_guide(text,timestamptz,jsonb,integer,integer)
  to service_role;
