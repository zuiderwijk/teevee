import { afterEach, describe, expect, it } from 'vitest';

import {
  defaultSupabaseSecretKey,
  edgeJson,
  parseBoundedJsonBody,
} from './supabaseEdgeRuntime';

type EdgeGlobal = typeof globalThis & {
  Deno?: {
    env: {
      get(name: string): string | undefined;
    };
  };
};

const edgeGlobal = globalThis as EdgeGlobal;
const originalDeno = edgeGlobal.Deno;

afterEach(() => {
  if (originalDeno === undefined) {
    delete edgeGlobal.Deno;
  } else {
    edgeGlobal.Deno = originalDeno;
  }
});

describe('Supabase Edge runtime helpers', () => {
  it('reads only a valid default Supabase secret key from Edge environment JSON', () => {
    edgeGlobal.Deno = {
      env: {
        get: (name) =>
          name === 'SUPABASE_SECRET_KEYS'
            ? JSON.stringify({ default: 'secret-key' })
            : undefined,
      },
    };
    expect(defaultSupabaseSecretKey()).toBe('secret-key');

    edgeGlobal.Deno = {
      env: {
        get: () => JSON.stringify({ default: '' }),
      },
    };
    expect(() => defaultSupabaseSecretKey()).toThrow(
      'Default Supabase secret key is unavailable',
    );
  });

  it('returns CORS + no-store JSON responses while preserving explicit headers', async () => {
    const response = edgeJson(
      { ok: true },
      {
        status: 201,
        headers: { 'X-Teevee-Test': 'yes' },
      },
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Teevee-Test')).toBe('yes');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('enforces the request-body limit in UTF-8 bytes and validates JSON', async () => {
    const payload = JSON.stringify({ query: 'éé' });
    const bytes = new TextEncoder().encode(payload).byteLength;

    await expect(
      parseBoundedJsonBody(
        new Request('https://teevee.test', { method: 'POST', body: payload }),
        bytes,
      ),
    ).resolves.toEqual({ query: 'éé' });

    await expect(
      parseBoundedJsonBody(
        new Request('https://teevee.test', { method: 'POST', body: payload }),
        bytes - 1,
      ),
    ).rejects.toThrow('Request body is too large');

    await expect(
      parseBoundedJsonBody(
        new Request('https://teevee.test', { method: 'POST', body: 'not-json' }),
        100,
      ),
    ).rejects.toThrow('valid JSON');
  });
});
