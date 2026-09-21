-- Align the development EPG cron with ADR 0008 television-day semantics.
--
-- The Edge Function derives D-3..D+8 as independent 06:00 Europe/Amsterdam windows.
-- D-2..D+7 is the product horizon. D-3 and D+8 are backend safety buffers; they do
-- not expand the selectable horizon. Partial provider windows are
-- skipped by ingestion and therefore never become authoritative canonical coverage.
create or replace function teevee.enqueue_development_epg_refresh()
returns bigint[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  cron_token text;
  request_id bigint;
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

  select net.http_post(
    url := 'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/epg-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-teevee-cron-token', cron_token
    ),
    body := jsonb_build_object('mode', 'guide-horizon'),
    timeout_milliseconds := 120000
  ) into request_id;

  return array[request_id];
end;
$$;

revoke execute on function teevee.enqueue_development_epg_refresh()
  from public, anon, authenticated;
grant execute on function teevee.enqueue_development_epg_refresh()
  to service_role;
