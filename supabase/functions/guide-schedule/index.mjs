import { SupabaseEditorialSignalRepository } from '../../../server/editorial/supabaseEditorialRepository.ts';
import { DEVELOPMENT_CHANNELS } from '../../../server/epg/developmentChannelCatalog.ts';
import {
  HOSTED_REQUEST_MAX_BODY_BYTES,
  parseHostedGuideScheduleRequest,
} from '../../../server/epg/hostedTransportPolicy.ts';
import { RepositoryGuideScheduleApi } from '../../../server/epg/scheduleService.ts';
import { SupabaseRestRpcClient } from '../../../server/epg/supabaseRestRpcClient.ts';
import { SupabaseScheduleRepository } from '../../../server/epg/supabaseScheduleRepository.ts';
import {
  defaultSupabaseSecretKey,
  edgeJson,
  parseBoundedJsonBody,
  TEEVEE_EDGE_CORS_HEADERS,
} from '../../../server/transport/supabaseEdgeRuntime.ts';
const CANONICAL_CHANNEL_IDS = DEVELOPMENT_CHANNELS.map(({ id }) => id);

function scheduleApi() {
  const client = new SupabaseRestRpcClient({
    baseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    apiKey: defaultSupabaseSecretKey(),
  });
  return new RepositoryGuideScheduleApi(
    new SupabaseScheduleRepository(client),
    new SupabaseEditorialSignalRepository(client),
  );
}

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: TEEVEE_EDGE_CORS_HEADERS });
    }
    if (req.method !== 'POST') return edgeJson({ error: 'Method not allowed' }, { status: 405 });

    let request;
    try {
      request = parseHostedGuideScheduleRequest(
        await parseBoundedJsonBody(req, HOSTED_REQUEST_MAX_BODY_BYTES),
        CANONICAL_CHANNEL_IDS,
      );
    } catch (error) {
      return edgeJson(
        { error: error instanceof Error ? error.message : 'Invalid schedule request' },
        { status: 400 },
      );
    }

    try {
      return edgeJson(await scheduleApi().getSchedule(request));
    } catch (error) {
      console.error('Teevee guide schedule read failed', error);
      return edgeJson({ status: 'unavailable' }, { status: 503 });
    }
  },
};
