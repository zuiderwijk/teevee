create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'teevee_epg_refresh_cron_token'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'teevee_epg_refresh_cron_token',
      'Dedicated server-side token for the scheduled Teevee development EPG refresh.'
    );
  end if;
end;
$$;

create or replace function public.teevee_validate_epg_refresh_cron_token(
  p_token text
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_token is not null
    and length(p_token) > 0
    and exists (
      select 1
      from vault.decrypted_secrets
      where name = 'teevee_epg_refresh_cron_token'
        and decrypted_secret = p_token
    );
$$;

revoke execute on function public.teevee_validate_epg_refresh_cron_token(text)
  from public, anon, authenticated;
grant execute on function public.teevee_validate_epg_refresh_cron_token(text)
  to service_role;

drop function if exists public.teevee_store_epg_refresh_secret(text);
delete from vault.secrets where name = 'teevee_epg_refresh_service_key';

create or replace function teevee.enqueue_development_epg_refresh()
returns bigint[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  cron_token text;
  local_today date;
  day0_start timestamptz;
  day1_start timestamptz;
  day2_start timestamptz;
  today_request_id bigint;
  tomorrow_request_id bigint;
begin
  select decrypted_secret
    into cron_token
  from vault.decrypted_secrets
  where name = 'teevee_epg_refresh_cron_token'
  order by updated_at desc
  limit 1;

  if cron_token is null or length(btrim(cron_token)) = 0 then
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
      'x-teevee-cron-token', cron_token
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
      'x-teevee-cron-token', cron_token
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
