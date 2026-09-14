import type { ScheduleRpcClient } from './supabaseScheduleRepository';

export type SupabaseRestRpcClientOptions = {
  baseUrl: string;
  apiKey: string;
  fetcher?: typeof fetch;
};

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} must not be empty`);
  return trimmed;
}

function errorMessage(value: unknown, fallback: string): string {
  if (typeof value === 'object' && value !== null) {
    const message = (value as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  return fallback;
}

/**
 * Minimal PostgREST RPC client for trusted server/Edge runtimes.
 *
 * New Supabase secret keys are sent only through `apikey`; unlike legacy JWT keys,
 * they must not be sent as `Authorization: Bearer ...`. This class deliberately
 * implements only the structural `ScheduleRpcClient` shape used by Teevee.
 */
export class SupabaseRestRpcClient implements ScheduleRpcClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;

  constructor(options: SupabaseRestRpcClientOptions) {
    this.baseUrl = required(options.baseUrl, 'Supabase baseUrl').replace(/\/+$/, '');
    this.apiKey = required(options.apiKey, 'Supabase apiKey');
    this.fetcher = options.fetcher ?? fetch;
  }

  async rpc<T>(functionName: string, args: Record<string, unknown>) {
    const name = required(functionName, 'RPC function name');
    const response = await this.fetcher(
      `${this.baseUrl}/rest/v1/rpc/${encodeURIComponent(name)}`,
      {
        method: 'POST',
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(args),
      },
    );

    const text = await response.text();
    let payload: unknown = null;
    if (text.trim()) {
      try {
        payload = JSON.parse(text);
      } catch {
        if (!response.ok) {
          return {
            data: null,
            error: { message: `HTTP ${response.status}: ${text.slice(0, 200)}` },
          };
        }
        return { data: null, error: { message: 'Supabase RPC returned invalid JSON' } };
      }
    }

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: errorMessage(payload, `HTTP ${response.status}`),
        },
      };
    }

    return { data: payload as T, error: null };
  }
}
