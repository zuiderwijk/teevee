import { withSupabase } from 'npm:@supabase/server@1.6.0';

import { DEVELOPMENT_CHANNELS } from '../../../server/epg/developmentChannelCatalog.ts';
import {
  HOSTED_REQUEST_MAX_BODY_BYTES,
  parseHostedGuideScheduleRequest,
} from '../../../server/epg/hostedTransportPolicy.ts';
import { RepositoryGuideScheduleApi } from '../../../server/epg/scheduleService.ts';
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
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
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
      const api = new RepositoryGuideScheduleApi(
        new SupabaseScheduleRepository(ctx.supabaseAdmin),
      );
      return json(await api.getSchedule(request));
    } catch (error) {
      console.error('Teevee guide schedule read failed', error);
      return json({ status: 'unavailable' }, { status: 503 });
    }
  }),
};
