-- Bounded EPG refresh orchestration for issue #167.
--
-- The existing six-hour cron still enters through protected epg-refresh guide-horizon
-- mode. That lightweight request creates one durable run whose children are bounded by
-- provider source x Amsterdam television-day x channel group. Child HTTP invocations are
-- globally serialized so provider load, TMDB fan-out and database replacement work stay
-- inside one Edge CPU budget at a time. A minute pump only recovers failed/expired work;
-- successful children immediately dispatch their successor.

create table teevee.epg_refresh_runs (
  id bigint generated always as identity primary key,
  request_key text not null unique,
  observed_at timestamptz not null,
  anchor_at timestamptz not null,
  status text not null default 'queued',
  job_count integer not null,
  created_at timestamptz not null default pg_catalog.now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  external_content_status text not null default 'pending',
  external_content_completed_at timestamptz,
  external_content_last_error text,
  constraint epg_refresh_runs_request_key_nonempty
    check (length(btrim(request_key)) > 0 and length(request_key) <= 128),
  constraint epg_refresh_runs_status
    check (status in ('queued','running','completed','incomplete','failed')),
  constraint epg_refresh_runs_job_count
    check (job_count > 0),
  constraint epg_refresh_runs_external_content_status
    check (external_content_status in ('pending','running','completed','skipped','failed'))
);

create table teevee.epg_refresh_jobs (
  id bigint generated always as identity primary key,
  run_id bigint not null references teevee.epg_refresh_runs(id) on delete cascade,
  ordinal integer not null,
  source_key text not null,
  day_offset integer not null,
  from_at timestamptz not null,
  to_at timestamptz not null,
  channel_group_key text not null,
  provider_channel_ids text[] not null,
  canonical_channel_ids text[] not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  attempt_token uuid,
  request_id bigint,
  available_at timestamptz not null default pg_catalog.now(),
  lease_expires_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  last_error text,
  outcome jsonb,
  external_content_status text not null default 'not-required',
  external_content_observation jsonb,
  external_content_attempt_count integer not null default 0,
  external_content_max_attempts integer not null default 3,
  external_content_attempt_token uuid,
  external_content_request_id bigint,
  external_content_available_at timestamptz not null default pg_catalog.now(),
  external_content_lease_expires_at timestamptz,
  external_content_started_at timestamptz,
  external_content_finished_at timestamptz,
  external_content_last_error text,
  external_content_outcome jsonb,
  constraint epg_refresh_jobs_ordinal check (ordinal > 0),
  constraint epg_refresh_jobs_source_key_nonempty check (length(btrim(source_key)) > 0),
  constraint epg_refresh_jobs_window check (to_at > from_at and to_at - from_at <= interval '25 hours'),
  constraint epg_refresh_jobs_group_key_nonempty check (length(btrim(channel_group_key)) > 0),
  constraint epg_refresh_jobs_provider_channels check (cardinality(provider_channel_ids) > 0),
  constraint epg_refresh_jobs_canonical_channels check (cardinality(canonical_channel_ids) > 0),
  constraint epg_refresh_jobs_channel_scope_cardinality
    check (cardinality(provider_channel_ids) = cardinality(canonical_channel_ids)),
  constraint epg_refresh_jobs_status
    check (status in ('queued','dispatched','running','succeeded','incomplete','failed')),
  constraint epg_refresh_jobs_attempt_count check (attempt_count >= 0),
  constraint epg_refresh_jobs_max_attempts check (max_attempts between 1 and 10),
  constraint epg_refresh_jobs_external_content_status
    check (external_content_status in ('not-required','queued','dispatched','running','completed','skipped','failed')),
  constraint epg_refresh_jobs_external_content_attempt_count
    check (external_content_attempt_count >= 0),
  constraint epg_refresh_jobs_external_content_max_attempts
    check (external_content_max_attempts between 1 and 10),
  unique (run_id, ordinal),
  unique (run_id, source_key, day_offset, channel_group_key)
);

create index epg_refresh_jobs_dispatch_idx
  on teevee.epg_refresh_jobs(status, available_at, run_id, ordinal);
create index epg_refresh_jobs_run_idx
  on teevee.epg_refresh_jobs(run_id, ordinal);
create index epg_refresh_jobs_external_content_dispatch_idx
  on teevee.epg_refresh_jobs(
    external_content_status,
    external_content_available_at,
    run_id,
    ordinal
  );

alter table teevee.epg_refresh_runs enable row level security;
alter table teevee.epg_refresh_jobs enable row level security;

revoke all on teevee.epg_refresh_runs from public, anon, authenticated;
revoke all on teevee.epg_refresh_jobs from public, anon, authenticated;
revoke all on sequence teevee.epg_refresh_runs_id_seq from public, anon, authenticated;
revoke all on sequence teevee.epg_refresh_jobs_id_seq from public, anon, authenticated;

grant select, insert, update, delete on teevee.epg_refresh_runs to service_role;
grant select, insert, update, delete on teevee.epg_refresh_jobs to service_role;
grant usage, select on sequence teevee.epg_refresh_runs_id_seq to service_role;
grant usage, select on sequence teevee.epg_refresh_jobs_id_seq to service_role;

create or replace function teevee.recompute_epg_refresh_run(
  p_run_id bigint
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
  v_external_content_status text;
  v_error text;
  v_external_content_error text;
begin
  if exists (
    select 1
    from teevee.epg_refresh_jobs j
    where j.run_id = p_run_id
      and j.status in ('queued','dispatched','running')
  ) then
    v_status := 'running';
  elsif exists (
    select 1
    from teevee.epg_refresh_jobs j
    where j.run_id = p_run_id and j.status = 'failed'
  ) then
    v_status := 'failed';
  elsif exists (
    select 1
    from teevee.epg_refresh_jobs j
    where j.run_id = p_run_id and j.status = 'incomplete'
  ) then
    v_status := 'incomplete';
  else
    v_status := 'completed';
  end if;

  select min(j.last_error)
    into v_error
  from teevee.epg_refresh_jobs j
  where j.run_id = p_run_id
    and j.status in ('failed','incomplete')
    and j.last_error is not null;

  if v_status = 'failed' then
    update teevee.epg_refresh_jobs
      set external_content_status = case
            when external_content_observation is null then 'not-required'
            else 'skipped'
          end,
          external_content_finished_at = case
            when external_content_observation is null then external_content_finished_at
            else coalesce(external_content_finished_at, pg_catalog.now())
          end,
          external_content_last_error = case
            when external_content_observation is null then external_content_last_error
            else 'guide-run-failed-before-enrichment'
          end,
          external_content_observation = null
    where run_id = p_run_id
      and external_content_status = 'queued';
  end if;

  if v_status = 'running' then
    v_external_content_status := 'pending';
  elsif v_status = 'failed' then
    v_external_content_status := 'skipped';
  elsif exists (
    select 1
    from teevee.epg_refresh_jobs j
    where j.run_id = p_run_id
      and j.external_content_status in ('queued','dispatched','running')
  ) then
    v_external_content_status := 'running';
  elsif exists (
    select 1
    from teevee.epg_refresh_jobs j
    where j.run_id = p_run_id
      and j.external_content_status = 'failed'
  ) then
    v_external_content_status := 'failed';
  else
    v_external_content_status := 'completed';
  end if;

  select min(j.external_content_last_error)
    into v_external_content_error
  from teevee.epg_refresh_jobs j
  where j.run_id = p_run_id
    and j.external_content_status = 'failed'
    and j.external_content_last_error is not null;

  update teevee.epg_refresh_runs
    set status = v_status,
        started_at = coalesce(started_at, pg_catalog.now()),
        completed_at = case
          when v_status in ('completed','incomplete','failed')
            then coalesce(completed_at, pg_catalog.now())
          else null
        end,
        last_error = case
          when v_status in ('failed','incomplete') then v_error
          else null
        end,
        external_content_status = v_external_content_status,
        external_content_completed_at = case
          when v_external_content_status in ('completed','skipped','failed')
            then coalesce(external_content_completed_at, pg_catalog.now())
          else null
        end,
        external_content_last_error = case
          when v_external_content_status = 'failed'
            then v_external_content_error
          else null
        end
  where id = p_run_id;

  return v_status;
end;
$$;

create or replace function teevee.dispatch_next_epg_refresh_job()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job record;
  v_phase text;
  v_cron_token text;
  v_attempt_token uuid;
  v_request_id bigint;
  v_run_id bigint;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended('teevee-epg-refresh-dispatch', 0)
  ) then
    return jsonb_build_object('status','busy');
  end if;

  update teevee.epg_refresh_jobs
    set status = case when attempt_count >= max_attempts then 'failed' else 'queued' end,
        available_at = case
          when attempt_count >= max_attempts then available_at
          else pg_catalog.now()
        end,
        lease_expires_at = null,
        attempt_token = null,
        request_id = null,
        finished_at = case
          when attempt_count >= max_attempts then pg_catalog.now()
          else null
        end,
        last_error = 'work-item lease expired before terminal completion'
  where status in ('dispatched','running')
    and lease_expires_at is not null
    and lease_expires_at <= pg_catalog.now();

  update teevee.epg_refresh_jobs
    set external_content_status = case
          when external_content_attempt_count >= external_content_max_attempts
            then 'failed'
          else 'queued'
        end,
        external_content_available_at = case
          when external_content_attempt_count >= external_content_max_attempts
            then external_content_available_at
          else pg_catalog.now()
        end,
        external_content_lease_expires_at = null,
        external_content_attempt_token = null,
        external_content_request_id = null,
        external_content_finished_at = case
          when external_content_attempt_count >= external_content_max_attempts
            then pg_catalog.now()
          else null
        end,
        external_content_last_error =
          'external-content lease expired before terminal completion',
        external_content_observation = case
          when external_content_attempt_count >= external_content_max_attempts
            then null
          else external_content_observation
        end
  where external_content_status in ('dispatched','running')
    and external_content_lease_expires_at is not null
    and external_content_lease_expires_at <= pg_catalog.now();

  if exists (
    select 1
    from teevee.epg_refresh_jobs
    where (
      status in ('dispatched','running')
      and lease_expires_at > pg_catalog.now()
    ) or (
      external_content_status in ('dispatched','running')
      and external_content_lease_expires_at > pg_catalog.now()
    )
  ) then
    return jsonb_build_object('status','busy');
  end if;

  -- Canonical Guide work always wins. This is the durable ADR-0011 ordering gate.
  select j.*, r.request_key
    into v_job
  from teevee.epg_refresh_jobs j
  join teevee.epg_refresh_runs r on r.id = j.run_id
  where j.status = 'queued'
    and j.available_at <= pg_catalog.now()
    and r.status in ('queued','running')
  order by r.created_at, j.ordinal
  for update of j skip locked
  limit 1;

  if found then
    v_phase := 'guide';
  elsif not exists (
    select 1
    from teevee.epg_refresh_jobs
    where status in ('queued','dispatched','running')
  ) then
    select j.*, r.request_key
      into v_job
    from teevee.epg_refresh_jobs j
    join teevee.epg_refresh_runs r on r.id = j.run_id
    where j.external_content_status = 'queued'
      and j.external_content_available_at <= pg_catalog.now()
      and j.external_content_observation is not null
      and j.status in ('succeeded','incomplete')
      and r.status in ('completed','incomplete')
    order by r.created_at, j.ordinal
    for update of j skip locked
    limit 1;

    if found then
      v_phase := 'external-content';
    end if;
  end if;

  if v_phase is null then
    for v_run_id in
      select r.id
      from teevee.epg_refresh_runs r
      where r.status in ('queued','running','completed','incomplete','failed')
        and r.external_content_status in ('pending','running')
    loop
      perform teevee.recompute_epg_refresh_run(v_run_id);
    end loop;
    return jsonb_build_object('status','idle');
  end if;

  select decrypted_secret
    into v_cron_token
  from vault.decrypted_secrets
  where name = 'teevee_epg_refresh_cron_token'
  order by updated_at desc
  limit 1;

  if v_cron_token is null or length(btrim(v_cron_token)) = 0 then
    if v_phase = 'guide' then
      update teevee.epg_refresh_jobs
        set last_error = 'cron-token-unavailable',
            available_at = pg_catalog.now() + interval '1 minute'
      where id = v_job.id;

      update teevee.epg_refresh_runs
        set last_error = 'cron-token-unavailable'
      where id = v_job.run_id;
    else
      update teevee.epg_refresh_jobs
        set external_content_last_error = 'cron-token-unavailable',
            external_content_available_at = pg_catalog.now() + interval '1 minute'
      where id = v_job.id;

      update teevee.epg_refresh_runs
        set external_content_last_error = 'cron-token-unavailable'
      where id = v_job.run_id;
    end if;

    return jsonb_build_object(
      'status','unavailable',
      'phase',v_phase,
      'reason','cron-token-unavailable',
      'runId',v_job.run_id,
      'jobId',v_job.id
    );
  end if;

  v_attempt_token := extensions.gen_random_uuid();

  select net.http_post(
    url := 'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/epg-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-teevee-cron-token', v_cron_token
    ),
    body := jsonb_build_object(
      'mode', case
        when v_phase = 'guide' then 'work-item'
        else 'external-content-work-item'
      end,
      'jobId', v_job.id,
      'attemptToken', v_attempt_token
    ),
    timeout_milliseconds := 120000
  ) into v_request_id;

  if v_phase = 'guide' then
    update teevee.epg_refresh_jobs
      set status = 'dispatched',
          attempt_count = attempt_count + 1,
          attempt_token = v_attempt_token,
          request_id = v_request_id,
          lease_expires_at = pg_catalog.now() + interval '8 minutes',
          last_error = null
    where id = v_job.id;

    update teevee.epg_refresh_runs
      set status = 'running',
          started_at = coalesce(started_at, pg_catalog.now()),
          completed_at = null
    where id = v_job.run_id;
  else
    update teevee.epg_refresh_jobs
      set external_content_status = 'dispatched',
          external_content_attempt_count = external_content_attempt_count + 1,
          external_content_attempt_token = v_attempt_token,
          external_content_request_id = v_request_id,
          external_content_lease_expires_at = pg_catalog.now() + interval '8 minutes',
          external_content_last_error = null
    where id = v_job.id;

    update teevee.epg_refresh_runs
      set external_content_status = 'running',
          external_content_completed_at = null,
          external_content_last_error = null
    where id = v_job.run_id;
  end if;

  return jsonb_build_object(
    'status','dispatched',
    'phase',v_phase,
    'runId',v_job.run_id,
    'jobId',v_job.id,
    'requestId',v_request_id,
    'attemptToken',v_attempt_token
  );
end;
$$;

create or replace function teevee.start_epg_refresh_run(
  p_request_key text,
  p_observed_at timestamptz,
  p_anchor_at timestamptz,
  p_jobs jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing teevee.epg_refresh_runs%rowtype;
  v_run_id bigint;
  v_job jsonb;
  v_ordinal bigint;
  v_source_key text;
  v_group_key text;
  v_day_offset integer;
  v_from timestamptz;
  v_to timestamptz;
  v_provider_ids text[];
  v_canonical_ids text[];
  v_job_count integer;
  v_dispatch jsonb;
  v_status text;
begin
  p_request_key := btrim(p_request_key);
  if p_request_key is null or length(p_request_key) = 0 or length(p_request_key) > 128 then
    raise exception 'requestKey is invalid';
  end if;
  if p_observed_at is null or p_anchor_at is null then
    raise exception 'observedAt and anchorAt are required';
  end if;
  if jsonb_typeof(p_jobs) is distinct from 'array'
     or jsonb_array_length(p_jobs) < 1
     or jsonb_array_length(p_jobs) > 1024 then
    raise exception 'jobs must contain 1..1024 work items';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('teevee-epg-refresh-run-start', 0)
  );

  select *
    into v_existing
  from teevee.epg_refresh_runs
  where request_key = p_request_key
  limit 1;

  if found then
    v_dispatch := teevee.dispatch_next_epg_refresh_job();
    select status into v_status from teevee.epg_refresh_runs where id = v_existing.id;
    return jsonb_build_object(
      'runId',v_existing.id,
      'status',v_status,
      'jobCount',v_existing.job_count,
      'reused',true
    );
  end if;

  v_job_count := jsonb_array_length(p_jobs);
  insert into teevee.epg_refresh_runs(request_key, observed_at, anchor_at, job_count)
  values (p_request_key, p_observed_at, p_anchor_at, v_job_count)
  returning id into v_run_id;

  for v_job, v_ordinal in
    select value, ordinality
    from jsonb_array_elements(p_jobs) with ordinality
  loop
    if jsonb_typeof(v_job) is distinct from 'object' then
      raise exception 'Every refresh job must be an object';
    end if;

    v_source_key := btrim(v_job->>'sourceKey');
    v_group_key := btrim(v_job->>'channelGroupKey');
    if v_source_key is null or length(v_source_key) = 0 then
      raise exception 'Refresh job sourceKey is required';
    end if;
    if v_group_key is null or length(v_group_key) = 0 then
      raise exception 'Refresh job channelGroupKey is required';
    end if;
    if jsonb_typeof(v_job->'dayOffset') is distinct from 'number' then
      raise exception 'Refresh job dayOffset must be an integer';
    end if;
    v_day_offset := (v_job->>'dayOffset')::integer;

    begin
      v_from := (v_job->>'from')::timestamptz;
      v_to := (v_job->>'to')::timestamptz;
    exception when others then
      raise exception 'Refresh job from/to must be valid timestamps';
    end;
    if v_to <= v_from or v_to - v_from > interval '25 hours' then
      raise exception 'Refresh job window must be within 25 hours';
    end if;

    if jsonb_typeof(v_job->'providerChannelIds') is distinct from 'array'
       or jsonb_array_length(v_job->'providerChannelIds') < 1 then
      raise exception 'Refresh job providerChannelIds must be a non-empty array';
    end if;
    select array_agg(value order by ordinality)
      into v_provider_ids
    from jsonb_array_elements_text(v_job->'providerChannelIds') with ordinality;
    if exists (
      select 1 from unnest(v_provider_ids) value
      where length(btrim(value)) = 0
    ) then
      raise exception 'Refresh job providerChannelIds must not contain blanks';
    end if;
    if cardinality(v_provider_ids) <> (
      select count(distinct provider_id)::integer
      from unnest(v_provider_ids) as provider_ids(provider_id)
    ) then
      raise exception 'Refresh job providerChannelIds must not contain duplicates';
    end if;

    if jsonb_typeof(v_job->'canonicalChannelIds') is distinct from 'array'
       or jsonb_array_length(v_job->'canonicalChannelIds') < 1 then
      raise exception 'Refresh job canonicalChannelIds must be a non-empty array';
    end if;
    select array_agg(btrim(value) order by btrim(value))
      into v_canonical_ids
    from jsonb_array_elements_text(v_job->'canonicalChannelIds');
    if exists (
      select 1 from unnest(v_canonical_ids) value
      where length(value) = 0
    ) then
      raise exception 'Refresh job canonicalChannelIds must not contain blanks';
    end if;
    if cardinality(v_canonical_ids) <> (
      select count(distinct channel_id)::integer
      from unnest(v_canonical_ids) as canonical_ids(channel_id)
    ) then
      raise exception 'Refresh job canonicalChannelIds must not contain duplicates';
    end if;
    if cardinality(v_canonical_ids) <> cardinality(v_provider_ids) then
      raise exception 'Refresh job canonicalChannelIds must match providerChannelIds cardinality';
    end if;

    insert into teevee.epg_refresh_jobs(
      run_id, ordinal, source_key, day_offset, from_at, to_at,
      channel_group_key, provider_channel_ids, canonical_channel_ids
    ) values (
      v_run_id, v_ordinal::integer, v_source_key, v_day_offset, v_from, v_to,
      v_group_key, v_provider_ids, v_canonical_ids
    );
  end loop;

  v_dispatch := teevee.dispatch_next_epg_refresh_job();
  select status into v_status from teevee.epg_refresh_runs where id = v_run_id;

  return jsonb_build_object(
    'runId',v_run_id,
    'status',v_status,
    'jobCount',v_job_count,
    'reused',false
  );
end;
$$;

create or replace function teevee.claim_epg_refresh_job(
  p_job_id bigint,
  p_attempt_token uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job teevee.epg_refresh_jobs%rowtype;
  v_observed_at timestamptz;
begin
  select *
    into v_job
  from teevee.epg_refresh_jobs
  where id = p_job_id
  for update;

  if not found then
    return jsonb_build_object('status','stale-attempt','jobId',p_job_id);
  end if;
  if v_job.status in ('succeeded','incomplete','failed') then
    return jsonb_build_object('status','terminal','jobId',p_job_id);
  end if;
  if v_job.attempt_token is distinct from p_attempt_token then
    return jsonb_build_object('status','stale-attempt','jobId',p_job_id);
  end if;
  if v_job.status = 'running' then
    return jsonb_build_object('status','duplicate','jobId',p_job_id);
  end if;
  if v_job.status <> 'dispatched'
     or v_job.lease_expires_at is null
     or v_job.lease_expires_at <= pg_catalog.now() then
    return jsonb_build_object('status','stale-attempt','jobId',p_job_id);
  end if;

  update teevee.epg_refresh_jobs
    set status = 'running',
        started_at = coalesce(started_at, pg_catalog.now()),
        lease_expires_at = pg_catalog.now() + interval '8 minutes'
  where id = p_job_id;

  select observed_at
    into v_observed_at
  from teevee.epg_refresh_runs
  where id = v_job.run_id;

  return jsonb_build_object(
    'status','claimed',
    'runId',v_job.run_id,
    'jobId',v_job.id,
    'attempt',v_job.attempt_count,
    'observedAt',v_observed_at,
    'sourceKey',v_job.source_key,
    'dayOffset',v_job.day_offset,
    'from',v_job.from_at,
    'to',v_job.to_at,
    'channelGroupKey',v_job.channel_group_key,
    'providerChannelIds',to_jsonb(v_job.provider_channel_ids),
    'canonicalChannelIds',to_jsonb(v_job.canonical_channel_ids)
  );
end;
$$;

create or replace function teevee.complete_epg_refresh_job(
  p_job_id bigint,
  p_attempt_token uuid,
  p_result text,
  p_outcome jsonb,
  p_error text,
  p_external_content_observation jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job teevee.epg_refresh_jobs%rowtype;
  v_job_status text;
  v_run_status text;
  v_dispatch jsonb;
  v_channel_id text;
  v_observed_at timestamptz;
  v_duration_seconds numeric;
  v_authoritative_channel_count integer := 0;
  v_outcome jsonb;
begin
  select *
    into v_job
  from teevee.epg_refresh_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'Unknown EPG refresh job';
  end if;
  if v_job.attempt_token is distinct from p_attempt_token then
    raise exception 'Stale EPG refresh job attempt';
  end if;

  if v_job.status in ('succeeded','incomplete','failed') then
    select status into v_run_status from teevee.epg_refresh_runs where id = v_job.run_id;
    return jsonb_build_object(
      'jobId',v_job.id,
      'jobStatus',v_job.status,
      'runId',v_job.run_id,
      'runStatus',v_run_status
    );
  end if;
  if v_job.status <> 'running' then
    raise exception 'EPG refresh job is not running';
  end if;
  if p_result is null
     or p_result not in ('succeeded','verify-stale-authority','incomplete','failed') then
    raise exception 'EPG refresh job result is invalid';
  end if;
  if p_external_content_observation is not null
     and jsonb_typeof(p_external_content_observation) is distinct from 'object' then
    raise exception 'External-content observation must be an object';
  end if;
  if p_result = 'failed' and p_external_content_observation is not null then
    raise exception 'Failed Guide work cannot stage external-content evidence';
  end if;
  if p_result = 'verify-stale-authority' and p_external_content_observation is not null then
    raise exception 'Ignored-stale Guide work cannot stage external-content evidence';
  end if;

  v_outcome := coalesce(p_outcome, '{}'::jsonb);

  if p_result = 'verify-stale-authority' then
    -- Use the exact canonical child scope persisted by the trusted planner. Lock in
    -- the same sorted per-channel order as ADR-0007 schedule replacement, then prove
    -- complete gap-free coverage at the parent observation or newer before terminal
    -- completion. The proof and job state transition commit atomically.
    foreach v_channel_id in array v_job.canonical_channel_ids loop
      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_channel_id, 0)
      );
    end loop;

    select observed_at
      into v_observed_at
    from teevee.epg_refresh_runs
    where id = v_job.run_id;

    v_duration_seconds := extract(epoch from (v_job.to_at - v_job.from_at));

    select count(*)::integer
      into v_authoritative_channel_count
    from (
      select c.channel_id
      from teevee.schedule_coverage c
      where c.channel_id = any(v_job.canonical_channel_ids)
        and c.coverage_range && tstzrange(v_job.from_at, v_job.to_at, '[)')
        and c.generated_at >= v_observed_at
      group by c.channel_id
      having sum(
        extract(
          epoch from (
            least(c.to_at, v_job.to_at) - greatest(c.from_at, v_job.from_at)
          )
        )
      ) >= v_duration_seconds
    ) covered;

    if v_authoritative_channel_count = cardinality(v_job.canonical_channel_ids) then
      p_result := 'succeeded';
      p_error := null;
      v_outcome := v_outcome || jsonb_build_object(
        'staleAuthorityProof',
        jsonb_build_object(
          'status','complete-same-or-newer',
          'requiredGeneratedAt',v_observed_at,
          'expectedChannelCount',cardinality(v_job.canonical_channel_ids),
          'authoritativeChannelCount',v_authoritative_channel_count
        )
      );
    else
      p_result := 'incomplete';
      p_error := 'ignored-stale-without-complete-same-or-newer-authority';
      v_outcome := v_outcome || jsonb_build_object(
        'staleAuthorityProof',
        jsonb_build_object(
          'status','incomplete',
          'requiredGeneratedAt',v_observed_at,
          'expectedChannelCount',cardinality(v_job.canonical_channel_ids),
          'authoritativeChannelCount',v_authoritative_channel_count
        )
      );
    end if;
  end if;

  if p_result = 'succeeded' then
    update teevee.epg_refresh_jobs
      set status = 'succeeded',
          lease_expires_at = null,
          finished_at = pg_catalog.now(),
          last_error = null,
          outcome = v_outcome,
          external_content_status = case
            when p_external_content_observation is null then 'not-required'
            else 'queued'
          end,
          external_content_observation = p_external_content_observation,
          external_content_available_at = pg_catalog.now(),
          external_content_last_error = null
    where id = p_job_id
    returning status into v_job_status;
  elsif p_result = 'incomplete' then
    update teevee.epg_refresh_jobs
      set status = 'incomplete',
          lease_expires_at = null,
          finished_at = pg_catalog.now(),
          last_error = left(
            coalesce(nullif(btrim(p_error),''),'work-item incomplete authority'),
            1000
          ),
          outcome = v_outcome,
          external_content_status = case
            when p_external_content_observation is null then 'not-required'
            else 'queued'
          end,
          external_content_observation = p_external_content_observation,
          external_content_available_at = pg_catalog.now(),
          external_content_last_error = null
    where id = p_job_id
    returning status into v_job_status;
  elsif v_job.attempt_count < v_job.max_attempts then
    update teevee.epg_refresh_jobs
      set status = 'queued',
          available_at = pg_catalog.now() + interval '30 seconds',
          lease_expires_at = null,
          attempt_token = null,
          request_id = null,
          last_error = left(coalesce(nullif(btrim(p_error),''),'work-item failed'),1000),
          outcome = v_outcome
    where id = p_job_id
    returning status into v_job_status;
  else
    update teevee.epg_refresh_jobs
      set status = 'failed',
          lease_expires_at = null,
          finished_at = pg_catalog.now(),
          last_error = left(coalesce(nullif(btrim(p_error),''),'work-item failed'),1000),
          outcome = v_outcome
    where id = p_job_id
    returning status into v_job_status;
  end if;

  v_run_status := teevee.recompute_epg_refresh_run(v_job.run_id);
  v_dispatch := teevee.dispatch_next_epg_refresh_job();

  select status into v_run_status from teevee.epg_refresh_runs where id = v_job.run_id;
  return jsonb_build_object(
    'jobId',v_job.id,
    'jobStatus',v_job_status,
    'runId',v_job.run_id,
    'runStatus',v_run_status
  );
end;
$$;

create or replace function teevee.claim_epg_refresh_external_content_job(
  p_job_id bigint,
  p_attempt_token uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $teevee$
declare
  v_job teevee.epg_refresh_jobs%rowtype;
begin
  select *
    into v_job
  from teevee.epg_refresh_jobs
  where id = p_job_id
  for update;

  if not found then
    return jsonb_build_object('status','stale-attempt','jobId',p_job_id);
  end if;
  if v_job.external_content_status in ('not-required','completed','skipped','failed') then
    return jsonb_build_object('status','terminal','jobId',p_job_id);
  end if;
  if v_job.external_content_attempt_token is distinct from p_attempt_token then
    return jsonb_build_object('status','stale-attempt','jobId',p_job_id);
  end if;
  if v_job.external_content_status = 'running' then
    return jsonb_build_object('status','duplicate','jobId',p_job_id);
  end if;
  if v_job.external_content_status <> 'dispatched'
     or v_job.external_content_lease_expires_at is null
     or v_job.external_content_lease_expires_at <= pg_catalog.now() then
    return jsonb_build_object('status','stale-attempt','jobId',p_job_id);
  end if;
  if v_job.external_content_observation is null then
    raise exception 'External-content work item has no staged observation';
  end if;

  update teevee.epg_refresh_jobs
    set external_content_status = 'running',
        external_content_started_at = coalesce(
          external_content_started_at,
          pg_catalog.now()
        ),
        external_content_lease_expires_at = pg_catalog.now() + interval '8 minutes'
  where id = p_job_id;

  return jsonb_build_object(
    'status','claimed',
    'runId',v_job.run_id,
    'jobId',v_job.id,
    'attempt',v_job.external_content_attempt_count,
    'externalContentObservation',v_job.external_content_observation
  );
end;
$teevee$;

create or replace function teevee.complete_epg_refresh_external_content_job(
  p_job_id bigint,
  p_attempt_token uuid,
  p_result text,
  p_outcome jsonb,
  p_error text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $teevee$
declare
  v_job teevee.epg_refresh_jobs%rowtype;
  v_external_content_status text;
  v_run_status text;
  v_dispatch jsonb;
begin
  select *
    into v_job
  from teevee.epg_refresh_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'Unknown EPG refresh external-content job';
  end if;
  if v_job.external_content_attempt_token is distinct from p_attempt_token then
    raise exception 'Stale EPG refresh external-content attempt';
  end if;

  if v_job.external_content_status in ('completed','failed','not-required') then
    select status into v_run_status
    from teevee.epg_refresh_runs
    where id = v_job.run_id;
    return jsonb_build_object(
      'jobId',v_job.id,
      'externalContentStatus',v_job.external_content_status,
      'runId',v_job.run_id,
      'runStatus',v_run_status
    );
  end if;
  if v_job.external_content_status <> 'running' then
    raise exception 'EPG refresh external-content job is not running';
  end if;
  if p_result is null or p_result not in ('succeeded','retryable-failure') then
    raise exception 'EPG refresh external-content result is invalid';
  end if;

  if p_result = 'succeeded' then
    update teevee.epg_refresh_jobs
      set external_content_status = 'completed',
          external_content_lease_expires_at = null,
          external_content_finished_at = pg_catalog.now(),
          external_content_last_error = null,
          external_content_outcome = v_outcome,
          external_content_observation = null
    where id = p_job_id
    returning external_content_status into v_external_content_status;
  elsif v_job.external_content_attempt_count < v_job.external_content_max_attempts then
    update teevee.epg_refresh_jobs
      set external_content_status = 'queued',
          external_content_available_at = pg_catalog.now() + interval '30 seconds',
          external_content_lease_expires_at = null,
          external_content_attempt_token = null,
          external_content_request_id = null,
          external_content_last_error = left(
            coalesce(nullif(btrim(p_error),''),'external-content work-item failed'),
            1000
          ),
          external_content_outcome = v_outcome
          -- Keep staged provider evidence for the next bounded attempt.
    where id = p_job_id
    returning external_content_status into v_external_content_status;
  else
    update teevee.epg_refresh_jobs
      set external_content_status = 'failed',
          external_content_lease_expires_at = null,
          external_content_finished_at = pg_catalog.now(),
          external_content_last_error = left(
            coalesce(nullif(btrim(p_error),''),'external-content work-item failed'),
            1000
          ),
          external_content_outcome = v_outcome,
          -- Retry budget is exhausted: no later worker may consume stale staging.
          external_content_observation = null
    where id = p_job_id
    returning external_content_status into v_external_content_status;
  end if;

  v_run_status := teevee.recompute_epg_refresh_run(v_job.run_id);
  v_dispatch := teevee.dispatch_next_epg_refresh_job();

  select status into v_run_status
  from teevee.epg_refresh_runs
  where id = v_job.run_id;

  return jsonb_build_object(
    'jobId',v_job.id,
    'externalContentStatus',v_external_content_status,
    'runId',v_job.run_id,
    'runStatus',v_run_status
  );
end;
$teevee$;

create or replace function teevee.pump_epg_refresh_jobs()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select teevee.dispatch_next_epg_refresh_job();
$$;

create or replace function public.teevee_start_epg_refresh_run(
  p_request_key text,
  p_observed_at timestamptz,
  p_anchor_at timestamptz,
  p_jobs jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select teevee.start_epg_refresh_run(
    p_request_key, p_observed_at, p_anchor_at, p_jobs
  );
$$;

create or replace function public.teevee_claim_epg_refresh_job(
  p_job_id bigint,
  p_attempt_token uuid
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select teevee.claim_epg_refresh_job(p_job_id, p_attempt_token);
$$;

create or replace function public.teevee_complete_epg_refresh_job(
  p_job_id bigint,
  p_attempt_token uuid,
  p_result text,
  p_outcome jsonb,
  p_error text,
  p_external_content_observation jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $bridge$
  select teevee.complete_epg_refresh_job(
    p_job_id, p_attempt_token, p_result, p_outcome, p_error,
    p_external_content_observation
  );
$bridge$;

create or replace function public.teevee_claim_epg_refresh_external_content_job(
  p_job_id bigint,
  p_attempt_token uuid
) returns jsonb
language sql
security invoker
set search_path = ''
as $bridge$
  select teevee.claim_epg_refresh_external_content_job(
    p_job_id, p_attempt_token
  );
$bridge$;

create or replace function public.teevee_complete_epg_refresh_external_content_job(
  p_job_id bigint,
  p_attempt_token uuid,
  p_result text,
  p_outcome jsonb,
  p_error text
) returns jsonb
language sql
security invoker
set search_path = ''
as $bridge$
  select teevee.complete_epg_refresh_external_content_job(
    p_job_id, p_attempt_token, p_result, p_outcome, p_error
  );
$bridge$;

revoke execute on function teevee.recompute_epg_refresh_run(bigint)
  from public, anon, authenticated;
revoke execute on function teevee.dispatch_next_epg_refresh_job()
  from public, anon, authenticated;
revoke execute on function teevee.start_epg_refresh_run(text,timestamptz,timestamptz,jsonb)
  from public, anon, authenticated;
revoke execute on function teevee.claim_epg_refresh_job(bigint,uuid)
  from public, anon, authenticated;
revoke execute on function teevee.complete_epg_refresh_job(bigint,uuid,text,jsonb,text,jsonb)
  from public, anon, authenticated;
revoke execute on function teevee.claim_epg_refresh_external_content_job(bigint,uuid)
  from public, anon, authenticated;
revoke execute on function teevee.complete_epg_refresh_external_content_job(bigint,uuid,text,jsonb,text)
  from public, anon, authenticated;
revoke execute on function teevee.pump_epg_refresh_jobs()
  from public, anon, authenticated;
revoke execute on function public.teevee_start_epg_refresh_run(text,timestamptz,timestamptz,jsonb)
  from public, anon, authenticated;
revoke execute on function public.teevee_claim_epg_refresh_job(bigint,uuid)
  from public, anon, authenticated;
revoke execute on function public.teevee_complete_epg_refresh_job(bigint,uuid,text,jsonb,text,jsonb)
  from public, anon, authenticated;
revoke execute on function public.teevee_claim_epg_refresh_external_content_job(bigint,uuid)
  from public, anon, authenticated;
revoke execute on function public.teevee_complete_epg_refresh_external_content_job(bigint,uuid,text,jsonb,text)
  from public, anon, authenticated;

grant execute on function teevee.recompute_epg_refresh_run(bigint) to service_role;
grant execute on function teevee.dispatch_next_epg_refresh_job() to service_role;
grant execute on function teevee.start_epg_refresh_run(text,timestamptz,timestamptz,jsonb)
  to service_role;
grant execute on function teevee.claim_epg_refresh_job(bigint,uuid) to service_role;
grant execute on function teevee.complete_epg_refresh_job(bigint,uuid,text,jsonb,text,jsonb)
  to service_role;
grant execute on function teevee.claim_epg_refresh_external_content_job(bigint,uuid)
  to service_role;
grant execute on function teevee.complete_epg_refresh_external_content_job(bigint,uuid,text,jsonb,text)
  to service_role;
grant execute on function teevee.pump_epg_refresh_jobs() to service_role;
grant execute on function public.teevee_start_epg_refresh_run(text,timestamptz,timestamptz,jsonb)
  to service_role;
grant execute on function public.teevee_claim_epg_refresh_job(bigint,uuid)
  to service_role;
grant execute on function public.teevee_complete_epg_refresh_job(bigint,uuid,text,jsonb,text,jsonb)
  to service_role;
grant execute on function public.teevee_claim_epg_refresh_external_content_job(bigint,uuid)
  to service_role;
grant execute on function public.teevee_complete_epg_refresh_external_content_job(bigint,uuid,text,jsonb,text)
  to service_role;

-- The existing six-hour teevee-development-epg-refresh job remains unchanged.
-- New Edge code derives a stable six-hour idempotency key from authenticated cron
-- requests, so this migration can be applied safely before the Edge deployment.

select cron.schedule(
  'teevee-development-epg-refresh-pump',
  '* * * * *',
  $cron$select teevee.pump_epg_refresh_jobs();$cron$
);
