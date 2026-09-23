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
import { enrichStoredExternalContent } from '../../../server/externalContent/enrichment.ts';
import { SupabaseProgrammeExternalContentRepository } from '../../../server/externalContent/supabaseProgrammeExternalContentRepository.ts';
import {
  TmdbApiClient,
  TmdbRequestSession,
} from '../../../server/externalContent/tmdbClient.ts';

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

const EXTERNAL_CONTENT_ENRICHMENT_BUDGET_MS = 20_000;

function externalContentRepository(secretKey) {
  return new SupabaseProgrammeExternalContentRepository(rpcClient(secretKey));
}

async function enrichExternalContent(observations, secretKey, ownerSignal) {
  if (observations.length === 0) {
    return { status: 'skipped', reason: 'no-authoritative-current-candidates' };
  }

  const token = Deno.env.get('TMDB_API_READ_ACCESS_TOKEN')?.trim();
  if (!token) {
    return { status: 'unavailable', reason: 'tmdb-secret-unavailable' };
  }

  const controller = new AbortController();
  const ownerAbort = () => controller.abort();
  ownerSignal?.addEventListener('abort', ownerAbort, { once: true });
  const timeout = setTimeout(
    () => controller.abort(),
    EXTERNAL_CONTENT_ENRICHMENT_BUDGET_MS,
  );

  try {
    const gateway = new TmdbRequestSession(
      new TmdbApiClient({
        token,
        signal: controller.signal,
        timeoutMs: 2500,
        maxRetries: 1,
        maxRetryAfterMs: 1000,
      }),
    );
    const result = await enrichStoredExternalContent({
      observations,
      gateway,
      repository: externalContentRepository(secretKey),
      concurrency: 3,
    });
    return { status: 'completed', ...result };
  } catch {
    return { status: 'unavailable', reason: 'external-content-enrichment-failed' };
  } finally {
    clearTimeout(timeout);
    ownerSignal?.removeEventListener('abort', ownerAbort);
  }
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

        // Canonical Guide writes for the entire horizon finish before any TMDB work.
        // Enrichment is therefore fail-open and cannot roll back or delay an individual
        // authoritative schedule transaction.
        const storedObservations = windows.flatMap(({ result }) =>
          result.storedObservation ? [result.storedObservation] : [],
        );
        const externalContent = await enrichExternalContent(
          storedObservations,
          secretKey,
          req.signal,
        );

        return Response.json({
          status: 'completed',
          mode: request.mode,
          windows: windows.map(horizonWindowResponse),
          externalContent,
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

      const externalContent = await enrichExternalContent(
        result.storedObservation ? [result.storedObservation] : [],
        secretKey,
        req.signal,
      );

      return Response.json({
        status: result.write.status,
        mode: request.mode,
        write: result.write,
        programmeCount: result.schedule.programmes.length,
        diagnosticCounts: diagnosticCounts(result),
        externalContent,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      console.error('Teevee EPG refresh failed', error);
      return errorResponse('EPG refresh failed', 502);
    }
  },
};
