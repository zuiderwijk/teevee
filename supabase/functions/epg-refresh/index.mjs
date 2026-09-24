import {
  hostedRefreshProviderChannelIds,
  planGuideHorizonRefreshWorkItems,
  resolveEpgRefreshWindowScope,
  resolveEpgRefreshWorkItemScope,
  scheduledEpgRefreshRequestKey,
  EPG_REFRESH_SOURCES,
} from '../../../server/epg/refreshTopology.ts';
import {
  HOSTED_REQUEST_MAX_BODY_BYTES,
  parseHostedRefreshRequest,
} from '../../../server/epg/hostedTransportPolicy.ts';
import { ingestProviderSchedule } from '../../../server/epg/ingest.ts';
import { classifyEpgRefreshWorkItemAuthority } from '../../../server/epg/refreshAuthority.ts';
import { SupabaseEpgRefreshOrchestrationRepository } from '../../../server/epg/supabaseEpgRefreshOrchestrationRepository.ts';
import { SupabaseRestRpcClient } from '../../../server/epg/supabaseRestRpcClient.ts';
import { SupabaseScheduleRepository } from '../../../server/epg/supabaseScheduleRepository.ts';
import { XmltvEpgProvider } from '../../../server/epg/xmltvProvider.ts';
import {
  enrichStoredExternalContent,
  selectExternalContentEnrichmentObservation,
} from '../../../server/externalContent/enrichment.ts';
import { SupabaseProgrammeExternalContentRepository } from '../../../server/externalContent/supabaseProgrammeExternalContentRepository.ts';
import {
  TmdbApiClient,
  TmdbRequestSession,
} from '../../../server/externalContent/tmdbClient.ts';

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

function rpcClient(secretKey, signal) {
  return new SupabaseRestRpcClient({
    baseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    apiKey: secretKey,
    signal,
  });
}

async function authorisationKind(req, secretKey) {
  const suppliedSecret = req.headers.get('apikey');
  if (
    typeof suppliedSecret === 'string' &&
    suppliedSecret.length > 0 &&
    suppliedSecret === secretKey
  ) {
    return 'service-key';
  }

  const cronToken = req.headers.get('x-teevee-cron-token');
  if (!cronToken || cronToken.length > 256) return null;

  const validation = await rpcClient(secretKey).rpc('teevee_validate_epg_refresh_cron_token', {
    p_token: cronToken,
  });
  if (validation.error) {
    console.error('Teevee cron token validation failed', validation.error.message);
    return null;
  }
  return validation.data === true ? 'cron-token' : null;
}

function repository(secretKey) {
  return new SupabaseScheduleRepository(rpcClient(secretKey));
}

function orchestrationRepository(secretKey) {
  return new SupabaseEpgRefreshOrchestrationRepository(rpcClient(secretKey));
}

const EXTERNAL_CONTENT_ENRICHMENT_BUDGET_MS = 20_000;

function externalContentRepository(secretKey, signal) {
  return new SupabaseProgrammeExternalContentRepository(rpcClient(secretKey, signal));
}

async function enrichExternalContent(observations, secretKey, ownerSignal) {
  if (observations.length === 0) {
    return { status: 'skipped', reason: 'no-authoritative-current-candidates' };
  }

  const token = Deno.env.get('TMDB_API_READ_ACCESS_TOKEN')?.trim();
  if (!token) {
    return { status: 'unavailable', reason: 'tmdb-secret-unavailable' };
  }

  const controller = new AbortController();
  const ownerAbort = () => controller.abort();
  ownerSignal?.addEventListener('abort', ownerAbort, { once: true });
  const timeout = setTimeout(
    () => controller.abort(),
    EXTERNAL_CONTENT_ENRICHMENT_BUDGET_MS,
  );

  try {
    const gateway = new TmdbRequestSession(
      new TmdbApiClient({
        token,
        signal: controller.signal,
        timeoutMs: 2500,
        maxRetries: 1,
        maxRetryAfterMs: 1000,
      }),
    );
    const result = await enrichStoredExternalContent({
      observations,
      gateway,
      repository: externalContentRepository(secretKey, controller.signal),
      concurrency: 3,
    });
    return { status: 'completed', ...result };
  } catch {
    return { status: 'unavailable', reason: 'external-content-enrichment-failed' };
  } finally {
    clearTimeout(timeout);
    ownerSignal?.removeEventListener('abort', ownerAbort);
  }
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

function diagnosticCounts(result) {
  return result.diagnostics.reduce(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { warning: 0, error: 0 },
  );
}

function workItemOutcome(
  claim,
  result,
  authority,
  externalContentObservation,
  elapsedMs,
) {
  return {
    authority,
    sourceKey: claim.sourceKey,
    dayOffset: claim.dayOffset,
    from: claim.from,
    to: claim.to,
    channelGroupKey: claim.channelGroupKey,
    providerChannelCount: claim.providerChannelIds.length,
    writeStatus: result.write.status,
    write: result.write,
    programmeCount: result.schedule.programmes.length,
    diagnosticCounts: diagnosticCounts(result),
    externalContent: externalContentObservation
      ? {
          status: 'deferred',
          eligibleProgrammeCount: externalContentObservation.programmes.length,
        }
      : { status: 'skipped', reason: 'no-authoritative-current-candidates' },
    elapsedMs,
  };
}

async function executeClaimedWorkItem({ claim, secretKey, startedAt }) {
  const scope = resolveEpgRefreshWorkItemScope({
    sourceKey: claim.sourceKey,
    providerChannelIds: claim.providerChannelIds,
  });
  const provider = new XmltvEpgProvider({
    key: scope.source.providerKey,
    url: scope.source.url,
  });
  const result = await ingestProviderSchedule({
    provider,
    repository: repository(secretKey),
    canonicalChannels: scope.canonicalChannels,
    channelMappings: scope.channelMappings,
    providerChannelIds: scope.providerChannelIds,
    from: new Date(claim.from),
    to: new Date(claim.to),
    clock: () => new Date(claim.observedAt),
  });
  const authority = classifyEpgRefreshWorkItemAuthority({
    expectedCanonicalChannelIds: scope.canonicalChannels.map(({ id }) => id),
    write: result.write,
  });
  const externalContentObservation = result.storedObservation
    ? selectExternalContentEnrichmentObservation(result.storedObservation)
    : null;
  const elapsedMs = Math.round(performance.now() - startedAt);
  return {
    result,
    authority,
    externalContentObservation,
    elapsedMs,
    outcome: workItemOutcome(
      claim,
      result,
      authority,
      externalContentObservation,
      elapsedMs,
    ),
  };
}

export default {
  async fetch(req) {
    if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

    let secretKey;
    try {
      secretKey = defaultSecretKey();
    } catch (error) {
      console.error('Teevee refresh secret configuration is invalid', error);
      return errorResponse('Refresh service unavailable', 503);
    }

    let authKind;
    try {
      authKind = await authorisationKind(req, secretKey);
      if (!authKind) return errorResponse('Unauthorized', 401);
    } catch (error) {
      console.error('Teevee refresh authorization failed', error);
      return errorResponse('Unauthorized', 401);
    }

    let request;
    try {
      request = parseHostedRefreshRequest(
        await parseJsonBody(req),
        hostedRefreshProviderChannelIds(),
      );
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Invalid refresh request', 400);
    }

    const startedAt = performance.now();

    if (request.mode === 'guide-horizon') {
      const refreshStartedAt = new Date();
      try {
        const jobs = planGuideHorizonRefreshWorkItems({
          anchorMs: refreshStartedAt.getTime(),
          requestedProviderChannelIds: request.providerChannelIds,
        });
        const run = await orchestrationRepository(secretKey).startRun({
          requestKey:
            request.requestKey ??
            (authKind === 'cron-token'
              ? scheduledEpgRefreshRequestKey(refreshStartedAt.getTime())
              : `manual:${crypto.randomUUID()}`),
          observedAt: refreshStartedAt.toISOString(),
          anchorAt: refreshStartedAt.toISOString(),
          jobs,
        });
        return Response.json(
          {
            status: 'accepted',
            mode: request.mode,
            run,
            workItemCount: jobs.length,
            sourceCount: EPG_REFRESH_SOURCES.length,
            elapsedMs: Math.round(performance.now() - startedAt),
          },
          { status: 202 },
        );
      } catch (error) {
        console.error('Teevee EPG refresh orchestration failed', error);
        return errorResponse('EPG refresh orchestration failed', 502);
      }
    }

    if (request.mode === 'work-item') {
      const orchestration = orchestrationRepository(secretKey);
      let claim;
      try {
        claim = await orchestration.claimJob({
          jobId: request.jobId,
          attemptToken: request.attemptToken,
        });
      } catch (error) {
        console.error('Teevee EPG work-item claim failed', error);
        return errorResponse('EPG refresh work-item claim failed', 502);
      }

      if (claim.status !== 'claimed') {
        return Response.json({
          status: claim.status,
          mode: request.mode,
          jobId: request.jobId,
          elapsedMs: Math.round(performance.now() - startedAt),
        });
      }

      try {
        const execution = await executeClaimedWorkItem({
          claim,
          secretKey,
          startedAt,
        });
        const completion = await orchestration.completeJob({
          jobId: claim.jobId,
          attemptToken: request.attemptToken,
          result:
            execution.authority.status === 'authoritative'
              ? 'succeeded'
              : 'incomplete',
          outcome: execution.outcome,
          ...(execution.authority.status === 'incomplete'
            ? { error: `incomplete-authority:${execution.authority.reason}` }
            : {}),
          ...(execution.externalContentObservation
            ? { externalContentObservation: execution.externalContentObservation }
            : {}),
        });
        return Response.json({
          status:
            execution.authority.status === 'authoritative'
              ? 'completed'
              : 'incomplete',
          mode: request.mode,
          runId: claim.runId,
          jobId: claim.jobId,
          attempt: claim.attempt,
          sourceKey: claim.sourceKey,
          dayOffset: claim.dayOffset,
          from: claim.from,
          to: claim.to,
          channelGroupKey: claim.channelGroupKey,
          providerChannelIds: claim.providerChannelIds,
          authority: execution.authority,
          write: execution.result.write,
          programmeCount: execution.result.schedule.programmes.length,
          diagnosticCounts: diagnosticCounts(execution.result),
          externalContent: execution.externalContentObservation
            ? {
                status: 'deferred',
                eligibleProgrammeCount:
                  execution.externalContentObservation.programmes.length,
              }
            : { status: 'skipped', reason: 'no-authoritative-current-candidates' },
          orchestration: completion,
          elapsedMs: execution.elapsedMs,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'work-item failed';
        console.error('Teevee EPG work-item failed', error);
        try {
          await orchestration.completeJob({
            jobId: claim.jobId,
            attemptToken: request.attemptToken,
            result: 'failed',
            outcome: {
              sourceKey: claim.sourceKey,
              dayOffset: claim.dayOffset,
              channelGroupKey: claim.channelGroupKey,
              elapsedMs: Math.round(performance.now() - startedAt),
            },
            error: message,
          });
        } catch (completionError) {
          console.error('Teevee EPG work-item failure completion failed', completionError);
        }
        return errorResponse('EPG refresh work-item failed', 502);
      }
    }

    if (request.mode === 'external-content-work-item') {
      const orchestration = orchestrationRepository(secretKey);
      let claim;
      try {
        claim = await orchestration.claimExternalContentJob({
          jobId: request.jobId,
          attemptToken: request.attemptToken,
        });
      } catch (error) {
        console.error('Teevee external-content work-item claim failed', error);
        return errorResponse('External-content work-item claim failed', 502);
      }

      if (claim.status !== 'claimed') {
        return Response.json({
          status: claim.status,
          mode: request.mode,
          jobId: request.jobId,
          elapsedMs: Math.round(performance.now() - startedAt),
        });
      }

      try {
        const externalContent = await enrichExternalContent(
          [claim.externalContentObservation],
          secretKey,
          req.signal,
        );
        const elapsedMs = Math.round(performance.now() - startedAt);
        const completion = await orchestration.completeExternalContentJob({
          jobId: claim.jobId,
          attemptToken: request.attemptToken,
          success: true,
          outcome: { externalContent, elapsedMs },
        });
        return Response.json({
          status: 'completed',
          mode: request.mode,
          runId: claim.runId,
          jobId: claim.jobId,
          attempt: claim.attempt,
          externalContent,
          orchestration: completion,
          elapsedMs,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'external-content work-item failed';
        console.error('Teevee external-content work-item failed', error);
        try {
          await orchestration.completeExternalContentJob({
            jobId: claim.jobId,
            attemptToken: request.attemptToken,
            success: false,
            outcome: {
              elapsedMs: Math.round(performance.now() - startedAt),
            },
            error: message,
          });
        } catch (completionError) {
          console.error(
            'Teevee external-content work-item failure completion failed',
            completionError,
          );
        }
        return errorResponse('External-content work-item failed', 502);
      }
    }

    const refreshStartedAt = new Date();
    try {
      const scope = resolveEpgRefreshWindowScope({
        providerChannelIds: request.providerChannelIds,
      });
      const provider = new XmltvEpgProvider({
        key: scope.source.providerKey,
        url: scope.source.url,
      });
      const result = await ingestProviderSchedule({
        provider,
        repository: repository(secretKey),
        canonicalChannels: scope.canonicalChannels,
        channelMappings: scope.channelMappings,
        providerChannelIds: scope.providerChannelIds,
        from: new Date(request.from),
        to: new Date(request.to),
        clock: () => refreshStartedAt,
      });
      const externalContent = await enrichExternalContent(
        result.storedObservation ? [result.storedObservation] : [],
        secretKey,
        req.signal,
      );

      return Response.json({
        status: result.write.status,
        mode: request.mode,
        write: result.write,
        programmeCount: result.schedule.programmes.length,
        diagnosticCounts: diagnosticCounts(result),
        externalContent,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      console.error('Teevee EPG refresh failed', error);
      return errorResponse('EPG refresh failed', 502);
    }
  },
};
