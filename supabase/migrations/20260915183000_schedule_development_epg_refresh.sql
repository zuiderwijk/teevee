create extension if not exists pg_net;
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create or replace function public.teevee_store_epg_refresh_secret(
  p_secret text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_id uuid;
begin
  if p_secret is null or length(btrim(p_secret)) = 0 then
    raise exception 'EPG refresh secret must not be empty';
  end if;

  select id
    into existing_id
  from vault.secrets
  where name = 'teevee_epg_refresh_service_key'
  limit 1;

  if existing_id is null then
    perform vault.create_secret(
      p_secret,
      'teevee_epg_refresh_service_key',
      'Server-only credential used by pg_cron to invoke protected Teevee development EPG refresh.'
    );
  else
    perform vault.update_secret(
      existing_id,
      p_secret,
      'teevee_epg_refresh_service_key',
      'Server-only credential used by pg_cron to invoke protected Teevee development EPG refresh.'
    );
  end if;
end;
$$;

revoke execute on function public.teevee_store_epg_refresh_secret(text)
  from public, anon, authenticated;
grant execute on function public.teevee_store_epg_refresh_secret(text)
  to service_role;

create or replace function teevee.enqueue_development_epg_refresh()
returns bigint[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  refresh_key text;
  local_today date;
  day0_start timestamptz;
  day1_start timestamptz;
  day2_start timestamptz;
  today_request_id bigint;
  tomorrow_request_id bigint;
begin
  select decrypted_secret
    into refresh_key
  from vault.decrypted_secrets
  where name = 'teevee_epg_refresh_service_key'
  order by updated_at desc
  limit 1;

  if refresh_key is null or length(btrim(refresh_key)) = 0 then
    return array[]::bigint[];
  end if;

  local_today := (clock_timestamp() at time zone 'Europe/Amsterdam')::date;
  day0_start := (local_today::timestamp without time zone) at time zone 'Europe/Amsterdam';
  day1_start := ((local_today + 1)::timestamp without time zone) at time zone 'Europe/Amsterdam';
  day2_start := ((local_today + 2)::timestamp without time zone) at time zone 'Europe/Amsterdam';

  select net.http_post(
    url := 'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/epg-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', refresh_key
    ),
    body := jsonb_build_object(
      'from', day0_start,
      'to', day1_start
    ),
    timeout_milliseconds := 30000
  ) into today_request_id;

  select net.http_post(
    url := 'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/epg-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', refresh_key
    ),
    body := jsonb_build_object(
      'from', day1_start,
      'to', day2_start
    ),
    timeout_milliseconds := 30000
  ) into tomorrow_request_id;

  return array[today_request_id, tomorrow_request_id];
end;
$$;

revoke execute on function teevee.enqueue_development_epg_refresh()
  from public, anon, authenticated, service_role;

select cron.schedule(
  'teevee-development-epg-refresh',
  '17 */6 * * *',
  $cron$select teevee.enqueue_development_epg_refresh();$cron$
);
