import { describe, expect, it, vi } from 'vitest';

import { SupabaseRestRpcClient } from './supabaseRestRpcClient';

function response(body: unknown, status = 200): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SupabaseRestRpcClient', () => {
  it('calls PostgREST RPC with the secret key only on apikey', async () => {
    const fetcher = vi.fn(async () => response({ status: 'stored' }));
    const client = new SupabaseRestRpcClient({
      baseUrl: 'https://teevee.supabase.co/',
      apiKey: 'sb_secret_test',
      fetcher,
    });

    await expect(client.rpc('teevee_replace_schedule_window', { p_from: 'x' })).resolves.toEqual({
      data: { status: 'stored' },
      error: null,
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://teevee.supabase.co/rest/v1/rpc/teevee_replace_schedule_window',
      {
        method: 'POST',
        headers: {
          apikey: 'sb_secret_test',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ p_from: 'x' }),
      },
    );
  });

  it('passes an optional owner AbortSignal to the PostgREST request', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal);
      return response({ ok: true });
    });
    const client = new SupabaseRestRpcClient({
      baseUrl: 'https://teevee.supabase.co',
      apiKey: 'sb_secret_test',
      fetcher,
      signal: controller.signal,
    });

    await expect(
      client.rpc('teevee_apply_programme_external_content_decisions', {}),
    ).resolves.toEqual({
      data: { ok: true },
      error: null,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('preserves null successful RPC responses', async () => {
    const client = new SupabaseRestRpcClient({
      baseUrl: 'https://teevee.supabase.co',
      apiKey: 'sb_secret_test',
      fetcher: vi.fn(async () => new Response('', { status: 200 })),
    });

    await expect(client.rpc('teevee_get_schedule', {})).resolves.toEqual({
      data: null,
      error: null,
    });
  });

  it('surfaces structured and non-JSON RPC failures without leaking the key', async () => {
    const structured = new SupabaseRestRpcClient({
      baseUrl: 'https://teevee.supabase.co',
      apiKey: 'sb_secret_sensitive',
      fetcher: vi.fn(async () => response({ message: 'permission denied' }, 403)),
    });
    await expect(structured.rpc('teevee_get_schedule', {})).resolves.toEqual({
      data: null,
      error: { message: 'permission denied' },
    });

    const plain = new SupabaseRestRpcClient({
      baseUrl: 'https://teevee.supabase.co',
      apiKey: 'sb_secret_sensitive',
      fetcher: vi.fn(async () => new Response('gateway failure', { status: 502 })),
    });
    const result = await plain.rpc('teevee_get_schedule', {});
    expect(result).toEqual({
      data: null,
      error: { message: 'HTTP 502: gateway failure' },
    });
    expect(JSON.stringify(result)).not.toContain('sb_secret_sensitive');
  });

  it('rejects empty configuration and invalid successful JSON', async () => {
    expect(() => new SupabaseRestRpcClient({ baseUrl: '', apiKey: 'key' })).toThrow('baseUrl');
    expect(() => new SupabaseRestRpcClient({ baseUrl: 'https://x.test', apiKey: '' })).toThrow('apiKey');

    const client = new SupabaseRestRpcClient({
      baseUrl: 'https://teevee.supabase.co',
      apiKey: 'sb_secret_test',
      fetcher: vi.fn(async () => new Response('not-json', { status: 200 })),
    });
    await expect(client.rpc('teevee_get_schedule', {})).resolves.toEqual({
      data: null,
      error: { message: 'Supabase RPC returned invalid JSON' },
    });
  });
});
