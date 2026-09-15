create or replace function public.teevee_enqueue_development_epg_refresh()
returns bigint[]
language sql
security invoker
set search_path = ''
as $$
  select teevee.enqueue_development_epg_refresh();
$$;

revoke execute on function public.teevee_enqueue_development_epg_refresh()
  from public, anon, authenticated;
grant execute on function public.teevee_enqueue_development_epg_refresh()
  to service_role;
