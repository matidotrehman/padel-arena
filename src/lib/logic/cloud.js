// Thin client for the shared-state Netlify function.
// Every call fails soft — if the endpoint isn't reachable (local dev, offline,
// not yet deployed) it returns { ok:false } and the app stays on LocalStorage.

const ENDPOINT = '/.netlify/functions/state';
const ROOM_KEY = 'padel6-shared-court'; // must match netlify/functions/state.mjs

export async function cloudGet() {
  try {
    const r = await fetch(ENDPOINT, { cache: 'no-store' });
    if (!r.ok) return { ok: false };
    const j = await r.json();
    return { ok: true, data: j?.data ?? null, updatedAt: j?.updatedAt ?? null };
  } catch {
    return { ok: false };
  }
}

export async function cloudPut(state) {
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-padel-key': ROOM_KEY },
      body: JSON.stringify({ data: state }),
    });
    return { ok: r.ok };
  } catch {
    return { ok: false };
  }
}
