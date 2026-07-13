import { writable } from 'svelte/store';

// Leaderboard ranking mode: 'points' (avg points/game) | 'winrate' (win %).
// Default is points-based (Americano style). Persisted per device.
const KEY = 'padel_rankmode';

function load() {
  try {
    return localStorage.getItem(KEY) === 'winrate' ? 'winrate' : 'points';
  } catch {
    return 'points';
  }
}

export const rankMode = writable(load());

rankMode.subscribe((v) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
});
