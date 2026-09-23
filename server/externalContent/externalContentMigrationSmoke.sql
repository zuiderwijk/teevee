\set ON_ERROR_STOP on
begin;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema extensions;

\ir ../../supabase/migrations/20260914001257_create_canonical_schedule_store.sql
\ir ../../supabase/migrations/20260914001538_create_schedule_rpc_bridge.sql
\ir ../../supabase/migrations/20260924001500_create_programme_external_content_reference.sql

do $smoke$
declare
  v_result jsonb;
begin
  v_result := public.teevee_replace_schedule_window(
    '2099-01-01T18:00:00Z',
    '2099-01-01T22:00:00Z',
    '2099-01-01T10:00:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','channel-1','name','Een','displayName','Een',
        'sortOrder',0,'isActive',true
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id','film-1','channelId','channel-1',
        'startAt','2099-01-01T18:00:00Z','endAt','2099-01-01T20:00:00Z',
        'title','Shared Film'
      ),
      jsonb_build_object(
        'id','film-2','channelId','channel-1',
        'startAt','2099-01-01T20:00:00Z','endAt','2099-01-01T22:00:00Z',
        'title','Shared Film'
      )
    )
  );
  if v_result->>'status' <> 'stored' then
    raise exception 'initial schedule write was not stored: %', v_result;
  end if;

  -- Multiple concrete broadcasts may share one TMDB content identity.
  v_result := public.teevee_apply_programme_external_content_decisions(
    '2099-01-01T10:00:00Z',
    '2099-01-01T10:00:01Z',
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','film-1','channelId','channel-1',
        'startAt','2099-01-01T18:00:00Z','endAt','2099-01-01T20:00:00Z',
        'title','Shared Film','status','resolved','source','tmdb',
        'mediaType','film','externalContentId','123','confidence','high',
        'matcherVersion',1
      ),
      jsonb_build_object(
        'programmeId','film-2','channelId','channel-1',
        'startAt','2099-01-01T20:00:00Z','endAt','2099-01-01T22:00:00Z',
        'title','Shared Film','status','resolved','source','tmdb',
        'mediaType','film','externalContentId','123','confidence','high',
        'matcherVersion',1
      )
    )
  );
  if (select count(*) from teevee.programme_external_content_references) <> 2 then
    raise exception 'shared external identity was not stored for both broadcasts';
  end if;
  if (select count(distinct external_content_id) from teevee.programme_external_content_references) <> 1 then
    raise exception 'shared external identity unexpectedly became unique';
  end if;

  -- Same-observation rerun is idempotent.
  v_result := public.teevee_apply_programme_external_content_decisions(
    '2099-01-01T10:00:00Z',
    '2099-01-01T10:00:02Z',
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','film-1','channelId','channel-1',
        'startAt','2099-01-01T18:00:00Z','endAt','2099-01-01T20:00:00Z',
        'title','Shared Film','status','resolved','source','tmdb',
        'mediaType','film','externalContentId','123','confidence','high',
        'matcherVersion',1
      )
    )
  );
  if (select count(*) from teevee.programme_external_content_references) <> 2 then
    raise exception 'idempotent identity rerun duplicated storage';
  end if;

  -- A definitive current unresolved decision clears a prior reference.
  v_result := public.teevee_apply_programme_external_content_decisions(
    '2099-01-01T10:00:00Z',
    '2099-01-01T10:00:03Z',
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','film-1','channelId','channel-1',
        'startAt','2099-01-01T18:00:00Z','endAt','2099-01-01T20:00:00Z',
        'title','Shared Film','status','unresolved'
      )
    )
  );
  if exists (
    select 1 from teevee.programme_external_content_references
    where programme_id = 'film-1'
  ) then
    raise exception 'current unresolved decision did not clear old reference';
  end if;

  -- Re-resolve, then correct/rekey the canonical Programme. FK ownership must
  -- cascade the old reference before any asynchronous late result can arrive.
  perform public.teevee_apply_programme_external_content_decisions(
    '2099-01-01T10:00:00Z',
    '2099-01-01T10:00:04Z',
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','film-1','channelId','channel-1',
        'startAt','2099-01-01T18:00:00Z','endAt','2099-01-01T20:00:00Z',
        'title','Shared Film','status','resolved','source','tmdb',
        'mediaType','film','externalContentId','123','confidence','high',
        'matcherVersion',1
      )
    )
  );

  perform public.teevee_replace_schedule_window(
    '2099-01-01T18:00:00Z',
    '2099-01-01T22:00:00Z',
    '2099-01-01T10:05:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','channel-1','name','Een','displayName','Een',
        'sortOrder',0,'isActive',true
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id','film-corrected','channelId','channel-1',
        'startAt','2099-01-01T18:02:00Z','endAt','2099-01-01T20:02:00Z',
        'title','Shared Film'
      )
    )
  );

  if exists (
    select 1 from teevee.programme_external_content_references
    where programme_id in ('film-1','film-2')
  ) then
    raise exception 'canonical correction left dangling external references';
  end if;

  -- Late result from the superseded observation cannot attach to either the old
  -- identity or the replacement broadcast.
  v_result := public.teevee_apply_programme_external_content_decisions(
    '2099-01-01T10:00:00Z',
    '2099-01-01T10:06:00Z',
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','film-1','channelId','channel-1',
        'startAt','2099-01-01T18:00:00Z','endAt','2099-01-01T20:00:00Z',
        'title','Shared Film','status','resolved','source','tmdb',
        'mediaType','film','externalContentId','999','confidence','high',
        'matcherVersion',1
      )
    )
  );
  if v_result->>'ignoredStaleCount' <> '1' then
    raise exception 'late stale identity result was not rejected: %', v_result;
  end if;

  -- Current replacement can resolve normally.
  v_result := public.teevee_apply_programme_external_content_decisions(
    '2099-01-01T10:05:00Z',
    '2099-01-01T10:06:01Z',
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','film-corrected','channelId','channel-1',
        'startAt','2099-01-01T18:02:00Z','endAt','2099-01-01T20:02:00Z',
        'title','Shared Film','status','resolved','source','tmdb',
        'mediaType','film','externalContentId','123','confidence','high',
        'matcherVersion',1
      )
    )
  );
  if not exists (
    select 1 from teevee.programme_external_content_references
    where programme_id = 'film-corrected'
      and external_content_id = '123'
  ) then
    raise exception 'current corrected broadcast did not receive external identity';
  end if;

  -- Authoritative deletion owns reference deletion via the canonical FK.
  perform public.teevee_replace_schedule_window(
    '2099-01-01T18:00:00Z',
    '2099-01-01T22:00:00Z',
    '2099-01-01T10:10:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','channel-1','name','Een','displayName','Een',
        'sortOrder',0,'isActive',true
      )
    ),
    '[]'::jsonb
  );
  if (select count(*) from teevee.programme_external_content_references) <> 0 then
    raise exception 'external reference survived canonical programme deletion';
  end if;
end
$smoke$;

rollback;
