import { withSupabase } from 'npm:@supabase/server@1.6.0';

import {
  DEVELOPMENT_CHANNELS,
  IPTV_EPG_NL_CHANNEL_MAPPINGS,
  IPTV_EPG_NL_PROVIDER_CHANNEL_IDS,
} from '../../../server/epg/developmentChannelCatalog.ts';
import { parseHostedRefreshRequest, HOSTED_REQUEST_MAX_BODY_BYTES } from '../../../server/epg/hostedTransportPolicy.ts';
import { ingestProviderSchedule } from '../../../server/epg/ingest.ts';
import { SupabaseScheduleRepository } from '../../../server/epg/supabaseScheduleRepository.ts';
import { XmltvEpgProvider } from '../../../server/epg/xmltvProvider.ts';

function errorResponse(message, status) {
  return Response.json({ error: message }, { status });
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
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

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
        repository: new SupabaseScheduleRepository(ctx.supabaseAdmin),
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
        { info: 0, warning: 0, error: 0 },
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
  }),
};
