// Keeps the local store and the shared cloud state in sync.
//
// Model: last-write-wins by the state's own `lastUpdated` timestamp.
//  - On start: pull remote; if it's newer, adopt it; otherwise seed remote
//    from local (first device to load populates the shared copy).
//  - On any local change: debounced push to the cloud.
//  - Every few seconds (and on tab focus): pull; adopt if remote is newer.
//
// For ~6 friends who rarely log at the exact same second this is plenty; the
// only lossy case is two people editing within the same poll window.
import { get } from 'svelte/store';
import { writable } from 'svelte/store';
import { store } from '../stores/store.js';
import { cloudGet, cloudPut } from './cloud.js';

// mode: 'connecting' | 'synced' | 'syncing' | 'local'
export const syncStatus = writable({ mode: 'connecting', lastSync: null });

const POLL_MS = 8000;
const PUSH_DEBOUNCE_MS = 1500;

let started = false;
let applyingRemote = false; // guard so adopting remote doesn't echo a push
let pushTimer = null;

const localUpdated = () => get(store).lastUpdated || 0;

function adopt(remoteState) {
  applyingRemote = true;
  store.set(remoteState); // preserve remote's lastUpdated (don't stamp a new one)
  applyingRemote = false;
}

async function pushNow() {
  const res = await cloudPut(get(store));
  syncStatus.set({ mode: res.ok ? 'synced' : 'local', lastSync: res.ok ? Date.now() : get(syncStatus).lastSync });
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
  if (res.data && (res.data.lastUpdated || 0) > localUpdated()) {
    adopt(res.data);
  }
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
    } else if (res.data && (res.data.lastUpdated || 0) > localUpdated()) {
      adopt(res.data);
      syncStatus.set({ mode: 'synced', lastSync: Date.now() });
    } else {
      await pushNow(); // remote empty or stale → seed it from this device
    }

    // Push local edits (skip the echo when we're applying a remote update).
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
