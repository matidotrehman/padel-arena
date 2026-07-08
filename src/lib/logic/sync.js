// Keeps the local store and the shared cloud state in sync via id-level MERGE
// (not last-write-wins), so concurrent edits from different phones never
// clobber each other:
//   - matches/players union by id, deletions tracked with tombstones
//   - the server merges every write under compare-and-set, so simultaneous
//     saves both survive
//   - the client merges remote into local on start, on push response, on poll
//     and on tab focus
// Fails soft to LocalStorage when the cloud is unreachable.
import { get, writable } from 'svelte/store';
import { store, applyMerged } from '../stores/store.js';
import { cloudGet, cloudPut } from './cloud.js';

// mode: 'connecting' | 'synced' | 'syncing' | 'local'
export const syncStatus = writable({ mode: 'connecting', lastSync: null });

const POLL_MS = 8000;
const PUSH_DEBOUNCE_MS = 1500;

let started = false;
let applyingRemote = false; // guard so adopting remote doesn't echo a push
let pushTimer = null;

// Merge a remote state into local without triggering a re-push.
function absorb(remoteState) {
  applyingRemote = true;
  try {
    applyMerged(remoteState);
  } finally {
    applyingRemote = false;
  }
}

async function pushNow() {
  const res = await cloudPut(get(store));
  if (res.ok) {
    if (res.data) absorb(res.data); // fold in anything the server merged concurrently
    syncStatus.set({ mode: 'synced', lastSync: Date.now() });
  } else {
    syncStatus.set({ mode: 'local', lastSync: get(syncStatus).lastSync });
  }
}

function schedulePush() {
  clearTimeout(pushTimer);
  syncStatus.update((s) => ({ ...s, mode: s.mode === 'local' ? 'local' : 'syncing' }));
  pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
}

async function poll() {
  const res = await cloudGet();
  if (!res.ok) {
    syncStatus.update((s) => ({ ...s, mode: 'local' }));
    return;
  }
  absorb(res.data);
  syncStatus.set({ mode: 'synced', lastSync: Date.now() });
}

export async function syncNow() {
  await poll();
  await pushNow();
}

export function startSync() {
  if (started || typeof window === 'undefined') return;
  started = true;

  (async () => {
    const res = await cloudGet();
    if (!res.ok) {
      syncStatus.set({ mode: 'local', lastSync: null });
    } else {
      absorb(res.data); // merge remote into local
      await pushNow(); // push the merged result so the shared copy is complete
    }

    // Push local edits (skip the echo while we're absorbing a remote update).
    store.subscribe(() => {
      if (!applyingRemote) schedulePush();
    });

    setInterval(poll, POLL_MS);
    window.addEventListener('focus', poll);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) poll();
    });
  })();
}
