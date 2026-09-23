export const TEEVEE_EDGE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
} as const;

export function edgeJson(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, {
    ...init,
    headers: {
      ...TEEVEE_EDGE_CORS_HEADERS,
      'Cache-Control': 'no-store',
      ...(init.headers ?? {}),
    },
  });
}

export function defaultSupabaseSecretKey(): string {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!raw) throw new Error('SUPABASE_SECRET_KEYS is unavailable');

  const keys = JSON.parse(raw) as unknown;
  if (
    typeof keys !== 'object' ||
    keys === null ||
    typeof (keys as Record<string, unknown>).default !== 'string' ||
    !(keys as Record<string, string>).default
  ) {
    throw new Error('Default Supabase secret key is unavailable');
  }
  return (keys as Record<string, string>).default;
}

export async function parseBoundedJsonBody(
  req: Request,
  maxBodyBytes: number,
): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBodyBytes) {
    throw new Error('Request body is too large');
  }
  if (!text.trim()) throw new Error('Request body is required');

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Request body must be valid JSON');
  }
}
