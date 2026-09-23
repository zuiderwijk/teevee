-- Phase 5A Guide Search: one bounded canonical-store read over the exact
-- D-2..D+7 television-day windows supplied by the server.
--
-- Search is intentionally separate from teevee.get_schedule(): the Guide read
-- returns full schedules for one bounded day, while Search returns only matching
-- canonical broadcasts/channels and explicit aggregate coverage semantics.

create extension if not exists unaccent with schema extensions;

create or replace function teevee.normalize_guide_search_text(p_value text)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.btrim(
    pg_catalog.regexp_replace(
      pg_catalog.translate(
        pg_catalog.replace(
          pg_catalog.lower(extensions.unaccent(coalesce(p_value, ''))),
          '&',
          ' en '
        ),
        pg_catalog.chr(39) || '’`´',
        ''
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;

create or replace function teevee.search_guide(
  p_query text,
  p_now timestamptz,
  p_windows jsonb,
  p_programme_limit integer,
  p_channel_limit integer
) returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_query text;
  v_active_channel_count integer := 0;
  v_covered_pair_count integer := 0;
  v_total_pair_count integer := 0;
  v_programme_coverage text := 'unavailable';
  v_channel_matches jsonb := '[]'::jsonb;
  v_programme_matches jsonb := '[]'::jsonb;
begin
  if p_query is null then
    raise exception 'Search query is required';
  end if;
  if p_now is null then
    raise exception 'Search now is required';
  end if;
  if jsonb_typeof(p_windows) is distinct from 'array'
     or jsonb_array_length(p_windows) <> 10 then
    raise exception 'Search windows must contain exactly ten television days';
  end if;
  if p_programme_limit is null or p_programme_limit < 1 or p_programme_limit > 50 then
    raise exception 'Programme Search limit must be between 1 and 50';
  end if;
  if p_channel_limit is null or p_channel_limit < 1 or p_channel_limit > 50 then
    raise exception 'Channel Search limit must be between 1 and 50';
  end if;

  v_query := teevee.normalize_guide_search_text(p_query);
  if length(v_query) < 2 or length(v_query) > 80 then
    raise exception 'Search query must contain 2 to 80 searchable characters';
  end if;

  if exists (
    with windows as (
      select
        item.ordinality,
        (item.value->>'from')::timestamptz as from_at,
        (item.value->>'to')::timestamptz as to_at
      from jsonb_array_elements(p_windows) with ordinality as item(value, ordinality)
    ),
    ordered as (
      select
        *,
        lag(to_at) over (order by ordinality) as previous_to
      from windows
    )
    select 1
    from ordered
    where from_at is null
       or to_at is null
       or to_at <= from_at
       or (ordinality > 1 and from_at is distinct from previous_to)
  ) then
    raise exception 'Search windows must be valid contiguous ranges';
  end if;

  select count(*)::integer
    into v_active_channel_count
  from teevee.channels
  where is_active;

  v_total_pair_count := v_active_channel_count * jsonb_array_length(p_windows);

  with windows as (
    select
      item.ordinality,
      (item.value->>'from')::timestamptz as from_at,
      (item.value->>'to')::timestamptz as to_at
    from jsonb_array_elements(p_windows) with ordinality as item(value, ordinality)
  ),
  pairs as (
    select
      c.id as channel_id,
      w.ordinality,
      w.from_at,
      w.to_at
    from teevee.channels c
    cross join windows w
    where c.is_active
  ),
  coverage as (
    select
      pair.channel_id,
      pair.ordinality,
      coalesce(
        sum(
          extract(
            epoch from (
              least(stored.to_at, pair.to_at)
              - greatest(stored.from_at, pair.from_at)
            )
          )
        ) filter (where stored.id is not null),
        0
      ) >= extract(epoch from (pair.to_at - pair.from_at)) as covered
    from pairs pair
    left join teevee.schedule_coverage stored
      on stored.channel_id = pair.channel_id
     and stored.coverage_range && tstzrange(pair.from_at, pair.to_at, '[)')
    group by pair.channel_id, pair.ordinality, pair.from_at, pair.to_at
  )
  select count(*) filter (where covered)::integer
    into v_covered_pair_count
  from coverage;

  v_programme_coverage := case
    when v_covered_pair_count = 0 then 'unavailable'
    when v_total_pair_count > 0 and v_covered_pair_count = v_total_pair_count then 'complete'
    else 'partial'
  end;

  with ranked_channels as (
    select
      c.*,
      match_info.rank as match_rank
    from teevee.channels c
    cross join lateral (
      select min(
        case
          when candidate.normalized = v_query then 0
          when candidate.normalized like v_query || '%' then 1
          when candidate.normalized like '%' || v_query || '%' then 2
          else null
        end
      ) as rank
      from (
        values
          (teevee.normalize_guide_search_text(c.display_name)),
          (teevee.normalize_guide_search_text(c.short_name)),
          (teevee.normalize_guide_search_text(c.name))
      ) as candidate(normalized)
    ) match_info
    where c.is_active
      and match_info.rank is not null
    order by match_info.rank, c.sort_order, c.id
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
  from ranked_channels;

  with windows as (
    select
      item.ordinality,
      (item.value->>'from')::timestamptz as from_at,
      (item.value->>'to')::timestamptz as to_at
    from jsonb_array_elements(p_windows) with ordinality as item(value, ordinality)
  ),
  pairs as (
    select
      c.id as channel_id,
      w.ordinality,
      w.from_at,
      w.to_at
    from teevee.channels c
    cross join windows w
    where c.is_active
  ),
  coverage as (
    select
      pair.channel_id,
      pair.ordinality,
      pair.from_at,
      pair.to_at,
      coalesce(
        sum(
          extract(
            epoch from (
              least(stored.to_at, pair.to_at)
              - greatest(stored.from_at, pair.from_at)
            )
          )
        ) filter (where stored.id is not null),
        0
      ) >= extract(epoch from (pair.to_at - pair.from_at)) as covered
    from pairs pair
    left join teevee.schedule_coverage stored
      on stored.channel_id = pair.channel_id
     and stored.coverage_range && tstzrange(pair.from_at, pair.to_at, '[)')
    group by pair.channel_id, pair.ordinality, pair.from_at, pair.to_at
  ),
  covered_pairs as (
    select channel_id, from_at, to_at
    from coverage
    where covered
  ),
  candidates as (
    select
      p.id,
      p.channel_id,
      p.start_at,
      p.end_at,
      p.title,
      p.subtitle,
      p.description,
      p.genre,
      p.is_live,
      p.is_repeat,
      c.name as channel_name,
      c.display_name as channel_display_name,
      c.sort_order as channel_sort_order,
      c.is_active as channel_is_active,
      c.short_name as channel_short_name,
      c.logo_url as channel_logo_url,
      case
        when normalized.title = v_query then 0
        when normalized.title like v_query || '%' then 1
        when normalized.title like '%' || v_query || '%' then 2
        else null
      end as match_rank,
      case
        when p.start_at <= p_now and p_now < p.end_at then 0
        when p.start_at >= p_now then 1
        else 2
      end as temporal_bucket
    from teevee.programmes p
    join teevee.channels c
      on c.id = p.channel_id
     and c.is_active
    cross join lateral (
      select teevee.normalize_guide_search_text(p.title) as title
    ) normalized
    where exists (
      select 1
      from covered_pairs covered
      where covered.channel_id = p.channel_id
        and p.start_at < covered.to_at
        and p.end_at > covered.from_at
    )
      and (
        normalized.title = v_query
        or normalized.title like v_query || '%'
        or normalized.title like '%' || v_query || '%'
      )
  ),
  ranked as (
    select *
    from candidates
    where match_rank is not null
    order by
      match_rank,
      temporal_bucket,
      case when temporal_bucket in (0, 1) then start_at end asc nulls last,
      case when temporal_bucket = 2 then start_at end desc nulls last,
      channel_sort_order,
      channel_id,
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
        temporal_bucket,
        case when temporal_bucket in (0, 1) then start_at end asc nulls last,
        case when temporal_bucket = 2 then start_at end desc nulls last,
        channel_sort_order,
        channel_id,
        id
    ),
    '[]'::jsonb
  )
  into v_programme_matches
  from ranked;

  return jsonb_build_object(
    'status', 'ok',
    'programmeCoverage', v_programme_coverage,
    'channelMatches', v_channel_matches,
    'programmeMatches', v_programme_matches,
    'editorialSignals', '[]'::jsonb
  );
end;
$$;

create or replace function public.teevee_search_guide(
  p_query text,
  p_now timestamptz,
  p_windows jsonb,
  p_programme_limit integer,
  p_channel_limit integer
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

revoke execute on function teevee.normalize_guide_search_text(text)
  from public, anon, authenticated;
revoke execute on function teevee.search_guide(text,timestamptz,jsonb,integer,integer)
  from public, anon, authenticated;
revoke execute on function public.teevee_search_guide(text,timestamptz,jsonb,integer,integer)
  from public, anon, authenticated;

grant execute on function teevee.normalize_guide_search_text(text)
  to service_role;
grant execute on function teevee.search_guide(text,timestamptz,jsonb,integer,integer)
  to service_role;
grant execute on function public.teevee_search_guide(text,timestamptz,jsonb,integer,integer)
  to service_role;
