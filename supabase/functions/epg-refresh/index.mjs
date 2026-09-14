import {
  DEVELOPMENT_CHANNELS,
  IPTV_EPG_NL_CHANNEL_MAPPINGS,
  IPTV_EPG_NL_PROVIDER_CHANNEL_IDS,
} from '../../../server/epg/developmentChannelCatalog.ts';
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

function authorised(req, secretKey) {
  const supplied = req.headers.get('apikey');
  return typeof supplied === 'string' && supplied.length > 0 && supplied === secretKey;
}

function repository(secretKey) {
  const client = new SupabaseRestRpcClient({
    baseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    apiKey: secretKey,
  });
  return new SupabaseScheduleRepository(client);
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
    if (!authorised(req, secretKey)) return errorResponse('Unauthorized', 401);

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
    try {
      const result = await ingestProviderSchedule({
        provider: new XmltvEpgProvider(),
        repository: repository(secretKey),
        canonicalChannels: [...DEVELOPMENT_CHANNELS],
        channelMappings: [...IPTV_EPG_NL_CHANNEL_MAPPINGS],
        providerChannelIds: request.providerChannelIds,
        from: new Date(request.from),
        to: new Date(request.to),
      });

      const diagnosticCounts = result.diagnostics.reduce(
        (counts, diagnostic) => {
          counts[diagnostic.severity] += 1;
          return counts;
        },
        { warning: 0, error: 0 },
      );

      return Response.json({
        status: result.write.status,
        write: result.write,
        programmeCount: result.schedule.programmes.length,
        diagnosticCounts,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      console.error('Teevee EPG refresh failed', error);
      return errorResponse('EPG refresh failed', 502);
    }
  },
};
