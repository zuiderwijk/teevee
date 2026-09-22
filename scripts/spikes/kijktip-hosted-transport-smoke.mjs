const ENDPOINT = 'https://eokszvpityhtysbwdduy.supabase.co/functions/v1/guide-schedule';

async function readWindow(label, from, to) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(label + ' HTTP ' + response.status);
  if (payload.status !== 'ok') throw new Error(label + ' schedule unavailable');
  if (!Array.isArray(payload.schedule?.programmes)) {
    throw new Error(label + ' missing canonical programmes');
  }
  if (!Array.isArray(payload.editorialSignals)) {
    throw new Error(label + ' missing typed editorialSignals array');
  }
  const programmeIds = new Set(payload.schedule.programmes.map((p) => p.id));
  if (payload.editorialSignals.some((signal) => !programmeIds.has(signal.programmeId))) {
    throw new Error(label + ' signal outside bounded schedule payload');
  }
  console.log('Kijktip hosted transport smoke ' + JSON.stringify({
    label,
    status: payload.status,
    channels: payload.schedule.channels.length,
    programmes: payload.schedule.programmes.length,
    editorialSignals: payload.editorialSignals.length,
  }));
}

await readWindow(
  'covered-window-without-editorial',
  '2026-09-20T04:00:00.000Z',
  '2026-09-21T04:00:00.000Z',
);
await readWindow(
  'covered-window-with-editorial',
  '2026-09-22T04:00:00.000Z',
  '2026-09-23T04:00:00.000Z',
);
