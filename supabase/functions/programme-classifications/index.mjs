import { SupabaseProgrammeClassificationRepository } from '../../../server/classification/supabaseProgrammeClassificationRepository.ts';
import { RepositoryProgrammeClassificationApi } from '../../../server/classification/classificationService.ts';
import { SupabaseRestRpcClient } from '../../../server/epg/supabaseRestRpcClient.ts';
import {
  parseProgrammeClassificationApiRequest,
} from '../../../services/api/programmeClassificationContract.ts';
import { HOSTED_REQUEST_MAX_BODY_BYTES } from '../../../server/epg/hostedTransportPolicy.ts';
import {
  defaultSupabaseSecretKey,
  edgeJson,
  parseBoundedJsonBody,
  TEEVEE_EDGE_CORS_HEADERS,
} from '../../../server/transport/supabaseEdgeRuntime.ts';

function classificationApi() {
  const client = new SupabaseRestRpcClient({
    baseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    apiKey: defaultSupabaseSecretKey(),
  });
  return new RepositoryProgrammeClassificationApi(
    new SupabaseProgrammeClassificationRepository(client),
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
      request = parseProgrammeClassificationApiRequest(
        await parseBoundedJsonBody(req, HOSTED_REQUEST_MAX_BODY_BYTES),
      );
    } catch (error) {
      return edgeJson(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Invalid programme classification request',
        },
        { status: 400 },
      );
    }

    try {
      return edgeJson(await classificationApi().getClassifications(request));
    } catch (error) {
      console.error('Teevee programme classification read failed', error);
      return edgeJson({ status: 'unavailable' }, { status: 503 });
    }
  },
};
