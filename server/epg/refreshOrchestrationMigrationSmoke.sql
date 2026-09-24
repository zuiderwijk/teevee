\set ON_ERROR_STOP on

create schema teevee;
create schema extensions;
create schema vault;
create schema net;
create schema cron;
create schema test_epg;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

grant usage on schema teevee to service_role;
grant usage on schema public to service_role, anon, authenticated;
grant usage on schema test_epg to service_role;

create sequence net.request_id_seq;
create table net.requests (
  id bigint primary key,
  url text not null,
  headers jsonb not null,
  body jsonb not null,
  timeout_milliseconds integer not null,
  created_at timestamptz not null default pg_catalog.now()
);

create or replace function net.http_post(
  url text,
  headers jsonb,
  body jsonb,
  timeout_milliseconds integer
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id bigint;
begin
  v_id := nextval('net.request_id_seq');
  insert into net.requests(id, url, headers, body, timeout_milliseconds)
  values (v_id, url, headers, body, timeout_milliseconds);
  return v_id;
end;
$$;

create table vault.decrypted_secrets (
  name text not null,
  decrypted_secret text,
  updated_at timestamptz not null default pg_catalog.now()
);

create table cron.scheduled_jobs (
  id bigint generated always as identity primary key,
  jobname text not null,
  schedule text not null,
  command text not null
);

create or replace function cron.schedule(
  p_jobname text,
  p_schedule text,
  p_command text
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id bigint;
begin
  insert into cron.scheduled_jobs(jobname, schedule, command)
  values (p_jobname, p_schedule, p_command)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function extensions.gen_random_uuid()
returns uuid
language sql
volatile
set search_path = ''
as $$
  select (
    substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-4' ||
    substr(md5(random()::text || clock_timestamp()::text), 1, 3) || '-a' ||
    substr(md5(random()::text || clock_timestamp()::text), 1, 3) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 1, 12)
  )::uuid;
$$;

create table test_epg.results (
  label text primary key,
  payload jsonb not null
);
create table test_epg.tokens (
  label text primary key,
  token uuid not null
);
grant select, insert, update on test_epg.results to service_role;
grant select, insert, update on test_epg.tokens to service_role;

create or replace function test_epg.assert_true(
  p_condition boolean,
  p_message text
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_condition is distinct from true then
    raise exception 'ASSERTION FAILED: %', p_message;
  end if;
end;
$$;

create or replace function test_epg.assert_json_status(
  p_payload jsonb,
  p_expected text,
  p_message text
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_payload->>'status' is distinct from p_expected then
    raise exception 'ASSERTION FAILED: % (expected status %, got %)',
      p_message, p_expected, p_payload->>'status';
  end if;
end;
$$;

grant execute on function test_epg.assert_true(boolean,text) to service_role;
grant execute on function test_epg.assert_json_status(jsonb,text,text) to service_role;

\i supabase/migrations/20260924095903_create_epg_refresh_orchestration.sql

select test_epg.assert_true(
  exists (
    select 1
    from cron.scheduled_jobs
    where jobname = 'teevee-development-epg-refresh-pump'
      and schedule = '* * * * *'
  ),
  'migration must schedule the recovery pump'
);

insert into vault.decrypted_secrets(name, decrypted_secret)
values ('teevee_epg_refresh_cron_token', 'test-cron-token');

set role service_role;

insert into test_epg.results(label, payload)
select 'run-1-start', public.teevee_start_epg_refresh_run(
  'cron:2026-09-24T06',
  '2026-09-24T06:17:00Z'::timestamptz,
  '2026-09-24T06:17:00Z'::timestamptz,
  jsonb_build_array(
    jsonb_build_object(
      'sourceKey','iptv-epg-nl',
      'dayOffset',0,
      'from','2026-09-24T04:00:00Z',
      'to','2026-09-25T04:00:00Z',
      'channelGroupKey','group-1',
      'providerChannelIds',jsonb_build_array('RTL4.nl')
    ),
    jsonb_build_object(
      'sourceKey','iptv-epg-nl',
      'dayOffset',1,
      'from','2026-09-25T04:00:00Z',
      'to','2026-09-26T04:00:00Z',
      'channelGroupKey','group-1',
      'providerChannelIds',jsonb_build_array('RTL4.nl')
    )
  )
);

select test_epg.assert_json_status(
  (select payload from test_epg.results where label='run-1-start'),
  'running',
  'first run starts and dispatches one child'
);

reset role;

select test_epg.assert_true(
  (select count(*) from teevee.epg_refresh_runs) = 1,
  'first request persists one run'
);
select test_epg.assert_true(
  (select count(*) from teevee.epg_refresh_jobs where status='dispatched') = 1
  and (select count(*) from teevee.epg_refresh_jobs where status='queued') = 1,
  'single-flight dispatches exactly one sibling'
);
select test_epg.assert_true(
  (select count(*) from net.requests) = 1,
  'first run emits exactly one child HTTP request'
);
select test_epg.assert_true(
  (
    select lease_expires_at - pg_catalog.now() > interval '7 minutes'
    from teevee.epg_refresh_jobs
    where ordinal = 1
      and run_id = (select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')
  ),
  'lease must exceed seven minutes and therefore the hosted 400 second worker maximum'
);

set role service_role;

insert into test_epg.tokens(label, token)
select 'run-1-job-1-attempt-1', attempt_token
from teevee.epg_refresh_jobs
where ordinal = 1
  and run_id = (select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06');

insert into test_epg.results(label, payload)
select 'run-1-job-1-claim-1', public.teevee_claim_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=1
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-1-attempt-1')
);

insert into test_epg.results(label, payload)
select 'run-1-job-1-duplicate', public.teevee_claim_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=1
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-1-attempt-1')
);

insert into test_epg.results(label, payload)
select 'run-1-job-1-stale-claim', public.teevee_claim_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=1
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  '00000000-0000-4000-8000-000000000099'::uuid
);

select test_epg.assert_json_status(
  (select payload from test_epg.results where label='run-1-job-1-claim-1'),
  'claimed',
  'first attempt claims successfully'
);
select test_epg.assert_json_status(
  (select payload from test_epg.results where label='run-1-job-1-duplicate'),
  'duplicate',
  'same token duplicate claim is idempotent'
);
select test_epg.assert_json_status(
  (select payload from test_epg.results where label='run-1-job-1-stale-claim'),
  'stale-attempt',
  'wrong token cannot claim running work'
);
select test_epg.assert_true(
  (
    select (payload->>'observedAt')::timestamptz =
           (select observed_at from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')
    from test_epg.results where label='run-1-job-1-claim-1'
  ),
  'claim inherits the common parent observation timestamp'
);

insert into test_epg.results(label, payload)
select 'run-2-start', public.teevee_start_epg_refresh_run(
  'cron:2026-09-24T12',
  '2026-09-24T12:17:00Z'::timestamptz,
  '2026-09-24T12:17:00Z'::timestamptz,
  jsonb_build_array(
    jsonb_build_object(
      'sourceKey','iptv-epg-nl',
      'dayOffset',0,
      'from','2026-09-24T04:00:00Z',
      'to','2026-09-25T04:00:00Z',
      'channelGroupKey','group-1',
      'providerChannelIds',jsonb_build_array('RTL4.nl')
    )
  )
);

reset role;

select test_epg.assert_true(
  (select count(*) from teevee.epg_refresh_runs) = 2
  and exists (
    select 1 from teevee.epg_refresh_runs
    where request_key='cron:2026-09-24T12' and status='queued'
  ),
  'a distinct scheduled bucket is persisted instead of being coalesced into an active run'
);
select test_epg.assert_true(
  (select count(*) from net.requests) = 1,
  'single-flight prevents the newer bucket from dispatching while old work is active'
);

update teevee.epg_refresh_jobs
set lease_expires_at = pg_catalog.now() - interval '1 second'
where ordinal = 1
  and run_id = (select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06');

set role service_role;
select teevee.pump_epg_refresh_jobs();
reset role;

select test_epg.assert_true(
  (
    select attempt_count = 2
      and status = 'dispatched'
      and attempt_token <> (select token from test_epg.tokens where label='run-1-job-1-attempt-1')
    from teevee.epg_refresh_jobs
    where ordinal = 1
      and run_id = (select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')
  ),
  'expired lease requeues and redispatches with a new attempt token'
);

set role service_role;

insert into test_epg.results(label, payload)
select 'run-1-job-1-old-token-after-expiry', public.teevee_claim_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=1
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-1-attempt-1')
);
select test_epg.assert_json_status(
  (select payload from test_epg.results where label='run-1-job-1-old-token-after-expiry'),
  'stale-attempt',
  'expired old token cannot reclaim replacement work'
);

insert into test_epg.tokens(label, token)
select 'run-1-job-1-attempt-2', attempt_token
from teevee.epg_refresh_jobs
where ordinal = 1
  and run_id = (select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06');

insert into test_epg.results(label, payload)
select 'run-1-job-1-claim-2', public.teevee_claim_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=1
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-1-attempt-2')
);

reset role;

do $$
declare
  v_job_id bigint;
  v_old_token uuid;
begin
  select id into v_job_id
  from teevee.epg_refresh_jobs
  where ordinal=1
    and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06');
  select token into v_old_token
  from test_epg.tokens
  where label='run-1-job-1-attempt-1';

  begin
    perform teevee.complete_epg_refresh_job(
      v_job_id,
      v_old_token,
      'succeeded',
      '{}'::jsonb,
      null
    );
    raise exception 'ASSERTION FAILED: stale completion unexpectedly succeeded';
  exception
    when others then
      if sqlerrm = 'ASSERTION FAILED: stale completion unexpectedly succeeded'
         or position('Stale EPG refresh job attempt' in sqlerrm) = 0 then
        raise;
      end if;
  end;
end;
$$;

set role service_role;

select public.teevee_complete_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=1
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-1-attempt-2'),
  'failed',
  '{"attempt":2}'::jsonb,
  'synthetic transient failure'
);

reset role;

select test_epg.assert_true(
  exists (
    select 1
    from teevee.epg_refresh_jobs
    where ordinal=1
      and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')
      and status='queued'
      and attempt_count=2
  ),
  'failed non-final attempt is queued for retry'
);
select test_epg.assert_true(
  exists (
    select 1
    from teevee.epg_refresh_jobs
    where ordinal=2
      and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')
      and status='dispatched'
  ),
  'sibling continues while earlier job is waiting for retry'
);

set role service_role;

insert into test_epg.tokens(label, token)
select 'run-1-job-2-attempt-1', attempt_token
from teevee.epg_refresh_jobs
where ordinal=2
  and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06');

insert into test_epg.results(label, payload)
select 'run-1-job-2-claim-1', public.teevee_claim_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=2
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-2-attempt-1')
);

select test_epg.assert_true(
  (
    select (payload->>'observedAt')::timestamptz =
           (select observed_at from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')
    from test_epg.results where label='run-1-job-2-claim-1'
  ),
  'sibling shares the parent observation timestamp'
);

select public.teevee_complete_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=2
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-2-attempt-1'),
  'succeeded',
  '{"authority":"exact"}'::jsonb,
  null
);

reset role;

update teevee.epg_refresh_jobs
set available_at = pg_catalog.now() - interval '1 second'
where ordinal=1
  and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06');

set role service_role;
select teevee.pump_epg_refresh_jobs();

insert into test_epg.tokens(label, token)
select 'run-1-job-1-attempt-3', attempt_token
from teevee.epg_refresh_jobs
where ordinal=1
  and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06');

insert into test_epg.results(label, payload)
select 'run-1-job-1-claim-3', public.teevee_claim_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=1
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-1-attempt-3')
);

select public.teevee_complete_epg_refresh_job(
  (select id from teevee.epg_refresh_jobs
   where ordinal=1
     and run_id=(select id from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06')),
  (select token from test_epg.tokens where label='run-1-job-1-attempt-3'),
  'failed',
  '{"attempt":3}'::jsonb,
  'synthetic exhausted failure'
);

reset role;

select test_epg.assert_true(
  (select status from teevee.epg_refresh_runs where request_key='cron:2026-09-24T06') = 'failed',
  'parent becomes failed only after siblings finish and one child exhausts attempts'
);
select test_epg.assert_true(
  exists (
    select 1
    from teevee.epg_refresh_jobs j
    join teevee.epg_refresh_runs r on r.id=j.run_id
    where r.request_key='cron:2026-09-24T12'
      and j.status='dispatched'
  ),
  'terminal older run dispatches the queued newer scheduled bucket'
);

set role service_role;

insert into test_epg.tokens(label, token)
select 'run-2-job-1-attempt-1', j.attempt_token
from teevee.epg_refresh_jobs j
join teevee.epg_refresh_runs r on r.id=j.run_id
where r.request_key='cron:2026-09-24T12' and j.ordinal=1;

insert into test_epg.results(label, payload)
select 'run-2-job-1-claim-1', public.teevee_claim_epg_refresh_job(
  (select j.id from teevee.epg_refresh_jobs j
   join teevee.epg_refresh_runs r on r.id=j.run_id
   where r.request_key='cron:2026-09-24T12' and j.ordinal=1),
  (select token from test_epg.tokens where label='run-2-job-1-attempt-1')
);

select public.teevee_complete_epg_refresh_job(
  (select j.id from teevee.epg_refresh_jobs j
   join teevee.epg_refresh_runs r on r.id=j.run_id
   where r.request_key='cron:2026-09-24T12' and j.ordinal=1),
  (select token from test_epg.tokens where label='run-2-job-1-attempt-1'),
  'incomplete',
  '{"authority":{"status":"incomplete","reason":"partial-provider-coverage"}}'::jsonb,
  'incomplete-authority:partial-provider-coverage'
);

reset role;

select test_epg.assert_true(
  (select status from teevee.epg_refresh_runs where request_key='cron:2026-09-24T12') = 'incomplete',
  'parent exposes terminal incomplete authority instead of completed'
);
select test_epg.assert_true(
  exists (
    select 1
    from teevee.epg_refresh_jobs j
    join teevee.epg_refresh_runs r on r.id=j.run_id
    where r.request_key='cron:2026-09-24T12'
      and j.status='incomplete'
      and j.last_error='incomplete-authority:partial-provider-coverage'
  ),
  'incomplete child outcome and reason are durable'
);

delete from vault.decrypted_secrets
where name='teevee_epg_refresh_cron_token';

set role service_role;

insert into test_epg.results(label, payload)
select 'run-3-start-no-token', public.teevee_start_epg_refresh_run(
  'cron:2026-09-24T18',
  '2026-09-24T18:17:00Z'::timestamptz,
  '2026-09-24T18:17:00Z'::timestamptz,
  jsonb_build_array(
    jsonb_build_object(
      'sourceKey','iptv-epg-nl',
      'dayOffset',0,
      'from','2026-09-24T04:00:00Z',
      'to','2026-09-25T04:00:00Z',
      'channelGroupKey','group-1',
      'providerChannelIds',jsonb_build_array('RTL4.nl')
    )
  )
);

reset role;

select test_epg.assert_true(
  exists (
    select 1 from teevee.epg_refresh_runs
    where request_key='cron:2026-09-24T18'
      and status='queued'
      and last_error='cron-token-unavailable'
  ),
  'missing Vault token leaves a durable queued run error'
);
select test_epg.assert_true(
  exists (
    select 1
    from teevee.epg_refresh_jobs j
    join teevee.epg_refresh_runs r on r.id=j.run_id
    where r.request_key='cron:2026-09-24T18'
      and j.status='queued'
      and j.last_error='cron-token-unavailable'
  ),
  'missing Vault token leaves a durable queued job error'
);

select 'EPG orchestration migration lifecycle smoke PASS' as result;
