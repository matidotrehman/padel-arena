// Shared group state in Netlify Blobs (free, no extra service).
// GET  -> { data }            (data is null until first write)
// POST -> body { data };      merges into the stored state under compare-and-set
//                             and returns { ok, data } (the merged result)
//
// Writes MERGE by id (see merge.js) under an ETag compare-and-set retry loop,
// so two phones saving at the same time can never overwrite each other.
//
// Guarded by a shared key (obscurity, not real auth) — fine for ~6 friends;
// rotate ROOM_KEY here + in cloud.js to reset.
import { getStore } from '@netlify/blobs';
import { mergeStates } from '../../src/lib/logic/merge.js';

const ROOM_KEY = 'padel6-shared-court';
const KEY = 'state';
const MAX_TRIES = 6;

export default async (req) => {
  const store = getStore('padel6');

  if (req.method === 'GET') {
    const data = await store.get(KEY, { type: 'json' });
    return json({ data: data ?? null });
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
    const incoming = body?.data ?? null;

    // Compare-and-set retry: read current + etag, merge, write only if the
    // stored value hasn't changed underneath us. Retry on conflict.
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      const cur = await store.getWithMetadata(KEY, { type: 'json' });
      const base = cur?.data ?? null;
      const merged = mergeStates(base, incoming);
      const opts = cur?.etag ? { onlyIfMatch: cur.etag } : { onlyIfNew: true };
      let res;
      try {
        res = await store.setJSON(KEY, merged, opts);
      } catch {
        res = null;
      }
      if (res && res.modified !== false) {
        return json({ ok: true, data: merged });
      }
      // conflict (someone wrote first) → loop and re-merge against the new value
    }

    // Fallback: last attempt without the guard (extremely unlikely to reach).
    const base = await store.get(KEY, { type: 'json' });
    const merged = mergeStates(base ?? null, incoming);
    await store.setJSON(KEY, merged);
    return json({ ok: true, data: merged });
  }

  return new Response('Method not allowed', { status: 405 });
};

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
