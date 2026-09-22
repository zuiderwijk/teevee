import { HttpTvgidsTipsSource } from '../../../server/editorial/tvgidsTipsFeed.ts';
import { refreshTvgidsEditorialSignals } from '../../../server/editorial/refresh.ts';
import { SupabaseEditorialSignalRepository } from '../../../server/editorial/supabaseEditorialRepository.ts';
import { SupabaseRestRpcClient } from '../../../server/epg/supabaseRestRpcClient.ts';
import { SupabaseScheduleRepository } from '../../../server/epg/supabaseScheduleRepository.ts';

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

  const cronToken = req.headers.get('x-teevee-editorial-cron-token');
  if (!cronToken || cronToken.length > 256) return false;

  const validation = await rpcClient(secretKey).rpc(
    'teevee_validate_editorial_refresh_cron_token',
    { p_token: cronToken },
  );
  if (validation.error) {
    console.error(
      'Teevee editorial cron token validation failed',
      validation.error.message,
    );
    return false;
  }
  return validation.data === true;
}

export default {
  async fetch(req) {
    if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

    let secretKey;
    try {
      secretKey = defaultSecretKey();
    } catch (error) {
      console.error('Teevee editorial refresh secret configuration is invalid', error);
      return errorResponse('Editorial refresh service unavailable', 503);
    }

    try {
      if (!(await authorised(req, secretKey))) {
        return errorResponse('Unauthorized', 401);
      }
    } catch (error) {
      console.error('Teevee editorial refresh authorization failed', error);
      return errorResponse('Unauthorized', 401);
    }

    const client = rpcClient(secretKey);
    const startedAt = performance.now();

    try {
      const result = await refreshTvgidsEditorialSignals({
        source: new HttpTvgidsTipsSource(),
        scheduleRepository: new SupabaseScheduleRepository(client),
        editorialRepository: new SupabaseEditorialSignalRepository(client),
      });
      console.info(
        'Teevee editorial refresh completed',
        JSON.stringify(result),
      );

      return Response.json({
        status: 'completed',
        ...result,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      console.error('Teevee editorial refresh failed', error);
      return errorResponse('Editorial refresh failed', 502);
    }
  },
};
