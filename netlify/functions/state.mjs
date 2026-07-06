// Shared group state, stored in Netlify Blobs (free, no extra service).
// GET  -> returns { data, updatedAt }  (data is null until first write)
// POST -> body { data }; overwrites the shared state, returns { ok, updatedAt }
//
// This is a tiny app for ~6 friends, so writes are guarded only by a shared
// key (obscurity, not real auth). Anyone who reads the site's JS can find it —
// fine for a private hobby app; rotate ROOM_KEY here + in cloud.js to reset.
import { getStore } from '@netlify/blobs';

const ROOM_KEY = 'padel6-shared-court';
const KEY = 'state';

export default async (req) => {
  const store = getStore('padel6');

  if (req.method === 'GET') {
    const record = await store.get(KEY, { type: 'json' });
    return json(record ?? { data: null, updatedAt: null });
  }

  if (req.method === 'POST') {
    if (req.headers.get('x-padel-key') !== ROOM_KEY) {
      return new Response('Forbidden', { status: 403 });
    }
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response('Bad JSON', { status: 400 });
    }
    const record = { data: body?.data ?? null, updatedAt: Date.now() };
    await store.setJSON(KEY, record);
    return json({ ok: true, updatedAt: record.updatedAt });
  }

  return new Response('Method not allowed', { status: 405 });
};

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
