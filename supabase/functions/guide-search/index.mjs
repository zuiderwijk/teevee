import { SupabaseEditorialSignalRepository } from '../../../server/editorial/supabaseEditorialRepository.ts';
import { SupabaseRestRpcClient } from '../../../server/epg/supabaseRestRpcClient.ts';
import { RepositoryGuideSearchApi } from '../../../server/search/searchService.ts';
import { SupabaseGuideSearchRepository } from '../../../server/search/supabaseGuideSearchRepository.ts';
import {
  parseGuideSearchApiRequest,
} from '../../../services/api/guideSearchContract.ts';
import { HOSTED_REQUEST_MAX_BODY_BYTES } from '../../../server/epg/hostedTransportPolicy.ts';
import {
  defaultSupabaseSecretKey,
  edgeJson,
  parseBoundedJsonBody,
  TEEVEE_EDGE_CORS_HEADERS,
} from '../../../server/transport/supabaseEdgeRuntime.ts';

function searchApi() {
  const client = new SupabaseRestRpcClient({
    baseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    apiKey: defaultSupabaseSecretKey(),
  });
  return new RepositoryGuideSearchApi(
    new SupabaseGuideSearchRepository(client),
    new SupabaseEditorialSignalRepository(client),
  );
}

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: TEEVEE_EDGE_CORS_HEADERS,
      });
    }
    if (req.method !== 'POST') {
      return edgeJson({ error: 'Method not allowed' }, { status: 405 });
    }

    let request;
    try {
      request = parseGuideSearchApiRequest(
        await parseBoundedJsonBody(req, HOSTED_REQUEST_MAX_BODY_BYTES),
      );
    } catch (error) {
      return edgeJson(
        { error: error instanceof Error ? error.message : 'Invalid search request' },
        { status: 400 },
      );
    }

    try {
      return edgeJson(await searchApi().search(request));
    } catch (error) {
      console.error('Teevee Guide Search failed', error);
      return edgeJson({ status: 'unavailable' }, { status: 503 });
    }
  },
};
