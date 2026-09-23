\set ON_ERROR_STOP on
begin;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema extensions;

\ir ../../supabase/migrations/20260914001257_create_canonical_schedule_store.sql
\ir ../../supabase/migrations/20260914001538_create_schedule_rpc_bridge.sql
\ir ../../supabase/migrations/20260923144656_create_programme_classification_foundation.sql
\ir ../../supabase/migrations/20260923201300_recover_programme_classification_siblings.sql

do $smoke$
declare
  v_result jsonb;
  v_read jsonb;
begin
  v_result := public.teevee_replace_schedule_window_classified(
    '2099-01-01T18:00:00Z',
    '2099-01-01T20:00:00Z',
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
        'id','programme-old','channelId','channel-1',
        'startAt','2099-01-01T18:00:00Z','endAt','2099-01-01T19:00:00Z',
        'title','Film'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','programme-old','contentType','film',
        'seriesType','unknown','audience','unknown','sportType','unknown',
        'liveStatus','unknown','repeatStatus','unknown','confidence','high'
      )
    )
  );
  if v_result->>'status' <> 'stored' then
    raise exception 'initial classified write was not stored: %', v_result;
  end if;

  v_read := public.teevee_get_programme_classifications(array['programme-old']);
  if jsonb_array_length(v_read) <> 1
     or v_read->0->>'contentType' <> 'film' then
    raise exception 'initial classification read failed: %', v_read;
  end if;

  -- Same broadcast again must remain idempotent.
  v_result := public.teevee_replace_schedule_window_classified(
    '2099-01-01T18:00:00Z',
    '2099-01-01T20:00:00Z',
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
        'id','programme-old','channelId','channel-1',
        'startAt','2099-01-01T18:00:00Z','endAt','2099-01-01T19:00:00Z',
        'title','Film'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','programme-old','contentType','film',
        'seriesType','unknown','audience','unknown','sportType','unknown',
        'liveStatus','unknown','repeatStatus','unknown','confidence','high'
      )
    )
  );
  if (select count(*) from teevee.programme_classifications) <> 1 then
    raise exception 'idempotent replacement duplicated classification';
  end if;

  -- Canonical start correction rekeys Programme.id; old classification must cascade.
  v_result := public.teevee_replace_schedule_window_classified(
    '2099-01-01T18:00:00Z',
    '2099-01-01T20:00:00Z',
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
        'id','programme-new','channelId','channel-1',
        'startAt','2099-01-01T18:02:00Z','endAt','2099-01-01T19:02:00Z',
        'title','Serie'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','programme-new','contentType','series',
        'seriesType','scripted-episodic','audience','general-mainstream',
        'sportType','unknown','liveStatus','false','repeatStatus','unknown',
        'confidence','high'
      )
    )
  );

  if exists (
    select 1 from teevee.programme_classifications
    where programme_id = 'programme-old'
  ) then
    raise exception 'old classification survived corrected Programme.id';
  end if;
  if not exists (
    select 1 from teevee.programme_classifications
    where programme_id = 'programme-new'
      and content_type = 'series'
  ) then
    raise exception 'corrected Programme.id classification missing';
  end if;

  -- Older refresh must mutate neither schedule nor classification.
  v_result := public.teevee_replace_schedule_window_classified(
    '2099-01-01T18:00:00Z',
    '2099-01-01T20:00:00Z',
    '2099-01-01T09:00:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','channel-1','name','Een','displayName','Een',
        'sortOrder',0,'isActive',true
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id','programme-stale','channelId','channel-1',
        'startAt','2099-01-01T18:04:00Z','endAt','2099-01-01T19:04:00Z',
        'title','Sport'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','programme-stale','contentType','sport',
        'seriesType','unknown','audience','unknown','sportType','event',
        'liveStatus','true','repeatStatus','false','confidence','high'
      )
    )
  );
  if v_result->>'status' <> 'ignored-stale' then
    raise exception 'stale classified write was not ignored: %', v_result;
  end if;
  if exists (
    select 1 from teevee.programme_classifications
    where programme_id = 'programme-stale'
  ) then
    raise exception 'stale classified write mutated storage';
  end if;

  v_read := public.teevee_get_programme_classifications(array['programme-new']);
  if jsonb_array_length(v_read) <> 1
     or v_read->0->>'seriesType' <> 'scripted-episodic'
     or v_read->0->>'liveStatus' <> 'false' then
    raise exception 'provider-independent read contract failed: %', v_read;
  end if;

  -- Programme deletion/authoritative empty replacement cascades stale classification.
  v_result := public.teevee_replace_schedule_window_classified(
    '2099-01-01T18:00:00Z',
    '2099-01-01T20:00:00Z',
    '2099-01-01T10:10:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','channel-1','name','Een','displayName','Een',
        'sortOrder',0,'isActive',true
      )
    ),
    '[]'::jsonb,
    '[]'::jsonb
  );
  if (select count(*) from teevee.programme_classifications) <> 0 then
    raise exception 'classification orphan survived programme deletion';
  end if;

  -- Non-destructive sibling recovery may classify an exact stored broadcast even
  -- when the provider observation itself was not authoritative for schedule replacement.
  v_result := public.teevee_replace_schedule_window(
    '2099-01-02T18:00:00Z',
    '2099-01-02T21:00:00Z',
    '2099-01-02T10:00:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','channel-1','name','Een','displayName','Een',
        'sortOrder',0,'isActive',true
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id','recovery-film','channelId','channel-1',
        'startAt','2099-01-02T18:00:00Z','endAt','2099-01-02T19:00:00Z',
        'title','Recovery film'
      ),
      jsonb_build_object(
        'id','recovery-retained','channelId','channel-1',
        'startAt','2099-01-02T19:00:00Z','endAt','2099-01-02T20:00:00Z',
        'title','Retained programme'
      )
    )
  );
  if v_result->>'status' <> 'stored' then
    raise exception 'unclassified recovery seed was not stored: %', v_result;
  end if;

  v_result := public.teevee_recover_programme_classifications(
    '2099-01-02T18:00:00Z',
    '2099-01-02T21:00:00Z',
    '2099-01-02T10:05:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','recovery-film','channelId','channel-1',
        'startAt','2099-01-02T18:00:00Z','endAt','2099-01-02T19:00:00Z',
        'title','Recovery film'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','recovery-film','contentType','film',
        'seriesType','unknown','audience','unknown','sportType','unknown',
        'liveStatus','unknown','repeatStatus','unknown','confidence','high'
      )
    )
  );
  if v_result->>'candidateProgrammeCount' <> '1'
     or v_result->>'matchedProgrammeCount' <> '1'
     or v_result->>'recoveredClassificationCount' <> '1'
     or v_result->>'unmatchedProgrammeCount' <> '0' then
    raise exception 'exact classification recovery failed: %', v_result;
  end if;
  if (select count(*) from teevee.programmes) <> 2 then
    raise exception 'classification recovery mutated canonical programme count';
  end if;
  if not exists (
    select 1 from teevee.programmes
    where id = 'recovery-retained' and title = 'Retained programme'
  ) then
    raise exception 'classification recovery removed unrelated canonical programme';
  end if;
  if (
    select count(*)
    from teevee.schedule_coverage
    where channel_id = 'channel-1'
      and coverage_range &&
        tstzrange(
          '2099-01-02T18:00:00Z'::timestamptz,
          '2099-01-02T21:00:00Z'::timestamptz,
          '[)'
        )
  ) <> 1 then
    raise exception 'classification recovery mutated schedule coverage';
  end if;
  if not exists (
    select 1 from teevee.schedule_coverage
    where channel_id = 'channel-1'
      and generated_at = '2099-01-02T10:00:00Z'::timestamptz
  ) then
    raise exception 'classification recovery changed coverage freshness';
  end if;

  -- Repeating the same recovery is idempotent: one sibling row remains.
  v_result := public.teevee_recover_programme_classifications(
    '2099-01-02T18:00:00Z',
    '2099-01-02T21:00:00Z',
    '2099-01-02T10:05:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','recovery-film','channelId','channel-1',
        'startAt','2099-01-02T18:00:00Z','endAt','2099-01-02T19:00:00Z',
        'title','Recovery film'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','recovery-film','contentType','film',
        'seriesType','unknown','audience','unknown','sportType','unknown',
        'liveStatus','unknown','repeatStatus','unknown','confidence','high'
      )
    )
  );
  if (select count(*) from teevee.programme_classifications) <> 1 then
    raise exception 'repeated recovery duplicated classification';
  end if;

  -- A provider start correction is not an exact match and therefore cannot attach
  -- evidence to the old canonical broadcast.
  v_result := public.teevee_recover_programme_classifications(
    '2099-01-02T18:00:00Z',
    '2099-01-02T21:00:00Z',
    '2099-01-02T10:06:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','recovery-corrected','channelId','channel-1',
        'startAt','2099-01-02T18:02:00Z','endAt','2099-01-02T19:02:00Z',
        'title','Recovery film'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','recovery-corrected','contentType','film',
        'seriesType','unknown','audience','unknown','sportType','unknown',
        'liveStatus','unknown','repeatStatus','unknown','confidence','high'
      )
    )
  );
  if v_result->>'matchedProgrammeCount' <> '0'
     or v_result->>'recoveredClassificationCount' <> '0'
     or v_result->>'unmatchedProgrammeCount' <> '1' then
    raise exception 'corrected recovery row did not fail closed: %', v_result;
  end if;
  if exists (
    select 1 from teevee.programme_classifications
    where programme_id = 'recovery-corrected'
  ) then
    raise exception 'unmatched correction created a classification orphan';
  end if;

  -- A newer authoritative replacement rekeys the broadcast and owns its sibling.
  v_result := public.teevee_replace_schedule_window_classified(
    '2099-01-02T18:00:00Z',
    '2099-01-02T21:00:00Z',
    '2099-01-02T10:10:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','channel-1','name','Een','displayName','Een',
        'sortOrder',0,'isActive',true
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'id','recovery-corrected','channelId','channel-1',
        'startAt','2099-01-02T18:02:00Z','endAt','2099-01-02T19:02:00Z',
        'title','Recovery film'
      ),
      jsonb_build_object(
        'id','recovery-retained','channelId','channel-1',
        'startAt','2099-01-02T19:00:00Z','endAt','2099-01-02T20:00:00Z',
        'title','Retained programme'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','recovery-corrected','contentType','film',
        'seriesType','unknown','audience','unknown','sportType','unknown',
        'liveStatus','unknown','repeatStatus','unknown','confidence','high'
      ),
      jsonb_build_object(
        'programmeId','recovery-retained','contentType','unknown',
        'seriesType','unknown','audience','unknown','sportType','unknown',
        'liveStatus','unknown','repeatStatus','unknown','confidence','unknown'
      )
    )
  );
  if v_result->>'status' <> 'stored' then
    raise exception 'authoritative correction after recovery was not stored: %', v_result;
  end if;
  if exists (
    select 1 from teevee.programme_classifications
    where programme_id = 'recovery-film'
  ) then
    raise exception 'old recovered sibling survived authoritative rekey';
  end if;

  -- A stale recovery observed before that authoritative write must not roll the
  -- newer sibling back even when its candidate now exactly matches.
  v_result := public.teevee_recover_programme_classifications(
    '2099-01-02T18:00:00Z',
    '2099-01-02T21:00:00Z',
    '2099-01-02T10:08:00Z',
    array['channel-1'],
    jsonb_build_array(
      jsonb_build_object(
        'id','recovery-corrected','channelId','channel-1',
        'startAt','2099-01-02T18:02:00Z','endAt','2099-01-02T19:02:00Z',
        'title','Recovery film'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'programmeId','recovery-corrected','contentType','unknown',
        'seriesType','unknown','audience','unknown','sportType','unknown',
        'liveStatus','unknown','repeatStatus','unknown','confidence','unknown'
      )
    )
  );
  if v_result->>'matchedProgrammeCount' <> '1'
     or v_result->>'ignoredStaleCount' <> '1'
     or v_result->>'recoveredClassificationCount' <> '0' then
    raise exception 'stale recovery was not ignored: %', v_result;
  end if;
  if not exists (
    select 1 from teevee.programme_classifications
    where programme_id = 'recovery-corrected'
      and content_type = 'film'
      and classified_at = '2099-01-02T10:10:00Z'::timestamptz
  ) then
    raise exception 'stale recovery rolled back newer classification';
  end if;

  if exists (
    select 1
    from teevee.programme_classifications c
    left join teevee.programmes p on p.id = c.programme_id
    where p.id is null
  ) then
    raise exception 'classification recovery lifecycle left an orphan';
  end if;
end
$smoke$;

rollback;
