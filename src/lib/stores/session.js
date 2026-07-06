import { writable } from 'svelte/store';

const KEY = 'padel_session';

function load() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// null = no active session. Otherwise { playerIds, rounds, createdAt }.
export const session = writable(load());

session.subscribe((s) => {
  if (typeof localStorage === 'undefined') return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
});

export function startSession(playerIds, rounds) {
  session.set({ playerIds, rounds, createdAt: Date.now() });
}

export function updateRoundScore(index, scoreA, scoreB) {
  session.update((s) => {
    if (!s) return s;
    const rounds = s.rounds.map((r, i) =>
      i === index ? { ...r, scoreA, scoreB } : r
    );
    return { ...s, rounds };
  });
}

export function endSession() {
  session.set(null);
}
