import { SupabaseEditorialSignalRepository } from '../../../server/editorial/supabaseEditorialRepository.ts';
import { DEVELOPMENT_CHANNELS } from '../../../server/epg/developmentChannelCatalog.ts';
import {
  HOSTED_REQUEST_MAX_BODY_BYTES,
  parseHostedGuideScheduleRequest,
} from '../../../server/epg/hostedTransportPolicy.ts';
import { RepositoryGuideScheduleApi } from '../../../server/epg/scheduleService.ts';
import { SupabaseRestRpcClient } from '../../../server/epg/supabaseRestRpcClient.ts';
import { SupabaseScheduleRepository } from '../../../server/epg/supabaseScheduleRepository.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const CANONICAL_CHANNEL_IDS = DEVELOPMENT_CHANNELS.map(({ id }) => id);

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'no-store',
      ...(init.headers ?? {}),
    },
  });
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

function scheduleApi() {
  const client = new SupabaseRestRpcClient({
    baseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    apiKey: defaultSecretKey(),
  });
  return new RepositoryGuideScheduleApi(
    new SupabaseScheduleRepository(client),
    new SupabaseEditorialSignalRepository(client),
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

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

    let request;
    try {
      request = parseHostedGuideScheduleRequest(
        await parseJsonBody(req),
        CANONICAL_CHANNEL_IDS,
      );
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : 'Invalid schedule request' },
        { status: 400 },
      );
    }

    try {
      return json(await scheduleApi().getSchedule(request));
    } catch (error) {
      console.error('Teevee guide schedule read failed', error);
      return json({ status: 'unavailable' }, { status: 503 });
    }
  },
};
