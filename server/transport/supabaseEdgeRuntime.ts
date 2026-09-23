export const TEEVEE_EDGE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
} as const;

type EdgeGlobal = typeof globalThis & {
  Deno?: {
    env: {
      get(name: string): string | undefined;
    };
  };
};

export function edgeJson(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(TEEVEE_EDGE_CORS_HEADERS);
  headers.set('Cache-Control', 'no-store');
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));

  return Response.json(data, {
    ...init,
    headers,
  });
}

export function defaultSupabaseSecretKey(): string {
  const edgeGlobal = globalThis as EdgeGlobal;
  const raw = edgeGlobal.Deno?.env.get('SUPABASE_SECRET_KEYS');
  if (!raw) throw new Error('SUPABASE_SECRET_KEYS is unavailable');

  const keys = JSON.parse(raw) as unknown;
  if (typeof keys !== 'object' || keys === null) {
    throw new Error('Default Supabase secret key is unavailable');
  }

  const defaultKey = (keys as Record<string, unknown>).default;
  if (typeof defaultKey !== 'string' || !defaultKey) {
    throw new Error('Default Supabase secret key is unavailable');
  }
  return defaultKey;
}

export async function parseBoundedJsonBody(
  req: Request,
  maxBodyBytes: number,
): Promise<unknown> {
  if (!Number.isInteger(maxBodyBytes) || maxBodyBytes <= 0) {
    throw new RangeError('maxBodyBytes must be a positive integer');
  }

  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > maxBodyBytes) {
    throw new Error('Request body is too large');
  }
  if (!text.trim()) throw new Error('Request body is required');

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Request body must be valid JSON');
  }
}
