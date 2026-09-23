import { recoverProviderClassifications } from '../../../server/classification/classificationRecovery.ts';
import { SupabaseProgrammeClassificationRecoveryRepository } from '../../../server/classification/supabaseProgrammeClassificationRecoveryRepository.ts';
import {
  DEVELOPMENT_CHANNELS,
  IPTV_EPG_NL_CHANNEL_MAPPINGS,
  IPTV_EPG_NL_PROVIDER_CHANNEL_IDS,
} from '../../../server/epg/developmentChannelCatalog.ts';
import { refreshGuideHorizon } from '../../../server/epg/guideHorizonRefresh.ts';
import {
  HOSTED_REQUEST_MAX_BODY_BYTES,
  parseHostedRefreshRequest,
} from '../../../server/epg/hostedTransportPolicy.ts';
import { ingestProviderSchedule } from '../../../server/epg/ingest.ts';
import { SupabaseRestRpcClient } from '../../../server/epg/supabaseRestRpcClient.ts';
import { SupabaseScheduleRepository } from '../../../server/epg/supabaseScheduleRepository.ts';
import { XmltvEpgProvider } from '../../../server/epg/xmltvProvider.ts';

function errorResponse(message, status) {
  return Response.json({ error: message }, { status });
}

function defaultSecretKey() {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!raw) throw new Error('SUPABASE_SECRET_KEYS is unavailable');
  const keys = JSON.parse(raw);
  if (typeof keys.default !== 'string' || !keys.default) {
    throw new Error('Default Supabase secret key is unavailable');
  }
  return keys.default;
}

function rpcClient(secretKey) {
  return new SupabaseRestRpcClient({
    baseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    apiKey: secretKey,
  });
}

async function authorised(req, secretKey) {
  const suppliedSecret = req.headers.get('apikey');
  if (
    typeof suppliedSecret === 'string' &&
    suppliedSecret.length > 0 &&
    suppliedSecret === secretKey
  ) {
    return true;
  }

  const cronToken = req.headers.get('x-teevee-cron-token');
  if (!cronToken || cronToken.length > 256) return false;

  const validation = await rpcClient(secretKey).rpc('teevee_validate_epg_refresh_cron_token', {
    p_token: cronToken,
  });
  if (validation.error) {
    console.error('Teevee cron token validation failed', validation.error.message);
    return false;
  }
  return validation.data === true;
}

function repository(secretKey) {
  return new SupabaseScheduleRepository(rpcClient(secretKey));
}

function classificationRecoveryRepository(secretKey) {
  return new SupabaseProgrammeClassificationRecoveryRepository(
    rpcClient(secretKey),
  );
}

async function parseJsonBody(req) {
  const text = await req.text();
  if (text.length > HOSTED_REQUEST_MAX_BODY_BYTES) {
    throw new Error('Request body is too large');
  }
  if (!text.trim()) throw new Error('Request body is required');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Request body must be valid JSON');
  }
}

function diagnosticCounts(result) {
  return result.diagnostics.reduce(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { warning: 0, error: 0 },
  );
}

function horizonWindowResponse(window) {
  return {
    offset: window.offset,
    from: window.from,
    to: window.to,
    status: window.result.write.status,
    write: window.result.write,
    programmeCount: window.result.schedule.programmes.length,
    diagnosticCounts: diagnosticCounts(window.result),
  };
}

export default {
  async fetch(req) {
    if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

    let secretKey;
    try {
      secretKey = defaultSecretKey();
    } catch (error) {
      console.error('Teevee refresh secret configuration is invalid', error);
      return errorResponse('Refresh service unavailable', 503);
    }

    try {
      if (!(await authorised(req, secretKey))) return errorResponse('Unauthorized', 401);
    } catch (error) {
      console.error('Teevee refresh authorization failed', error);
      return errorResponse('Unauthorized', 401);
    }

    let request;
    try {
      request = parseHostedRefreshRequest(
        await parseJsonBody(req),
        IPTV_EPG_NL_PROVIDER_CHANNEL_IDS,
      );
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Invalid refresh request', 400);
    }

    const startedAt = performance.now();
    const refreshStartedAt = new Date();
    const provider = new XmltvEpgProvider();
    const scheduleRepository = repository(secretKey);

    try {
      if (request.mode === 'guide-horizon') {
        const windows = await refreshGuideHorizon({
          provider,
          repository: scheduleRepository,
          canonicalChannels: [...DEVELOPMENT_CHANNELS],
          channelMappings: [...IPTV_EPG_NL_CHANNEL_MAPPINGS],
          providerChannelIds: request.providerChannelIds,
          anchorMs: refreshStartedAt.getTime(),
          clock: () => refreshStartedAt,
        });

        return Response.json({
          status: 'completed',
          mode: request.mode,
          windows: windows.map(horizonWindowResponse),
          elapsedMs: Math.round(performance.now() - startedAt),
        });
      }

      if (request.mode === 'classification-recovery') {
        const result = await recoverProviderClassifications({
          provider,
          repository: classificationRecoveryRepository(secretKey),
          canonicalChannels: [...DEVELOPMENT_CHANNELS],
          channelMappings: [...IPTV_EPG_NL_CHANNEL_MAPPINGS],
          providerChannelIds: request.providerChannelIds,
          from: new Date(request.from),
          to: new Date(request.to),
          clock: () => refreshStartedAt,
        });

        return Response.json({
          status: 'completed',
          mode: request.mode,
          providerCoverage: result.providerCoverage,
          observedAt: result.observedAt,
          candidateProgrammeCount: result.candidateProgrammeCount,
          recovery: result.recovery,
          diagnosticCounts: result.diagnostics.reduce(
            (counts, diagnostic) => {
              counts[diagnostic.severity] += 1;
              return counts;
            },
            { warning: 0, error: 0 },
          ),
          elapsedMs: Math.round(performance.now() - startedAt),
        });
      }

      const result = await ingestProviderSchedule({
        provider,
        repository: scheduleRepository,
        canonicalChannels: [...DEVELOPMENT_CHANNELS],
        channelMappings: [...IPTV_EPG_NL_CHANNEL_MAPPINGS],
        providerChannelIds: request.providerChannelIds,
        from: new Date(request.from),
        to: new Date(request.to),
        clock: () => refreshStartedAt,
      });

      return Response.json({
        status: result.write.status,
        mode: request.mode,
        write: result.write,
        programmeCount: result.schedule.programmes.length,
        diagnosticCounts: diagnosticCounts(result),
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      console.error('Teevee EPG refresh failed', error);
      return errorResponse('EPG refresh failed', 502);
    }
  },
};
