create or replace function public.teevee_replace_schedule_window(
  p_from timestamptz,
  p_to timestamptz,
  p_generated_at timestamptz,
  p_channel_ids text[],
  p_channels jsonb,
  p_programmes jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select teevee.replace_schedule_window(
    p_from,
    p_to,
    p_generated_at,
    p_channel_ids,
    p_channels,
    p_programmes
  );
$$;

create or replace function public.teevee_get_schedule(
  p_from timestamptz,
  p_to timestamptz,
  p_channel_ids text[] default null
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select teevee.get_schedule(p_from, p_to, p_channel_ids);
$$;

revoke execute on function public.teevee_replace_schedule_window(timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb) from public, anon, authenticated;
revoke execute on function public.teevee_get_schedule(timestamptz,timestamptz,text[]) from public, anon, authenticated;
grant execute on function public.teevee_replace_schedule_window(timestamptz,timestamptz,timestamptz,text[],jsonb,jsonb) to service_role;
grant execute on function public.teevee_get_schedule(timestamptz,timestamptz,text[]) to service_role;
