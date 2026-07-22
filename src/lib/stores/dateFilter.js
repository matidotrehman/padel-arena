import { writable } from 'svelte/store';

// Date-range filter for the dashboard: scopes leaderboard/badges/chemistry
// stats to a timeframe. Persisted per device, like rankMode/theme.
const KEY = 'padel_datefilter';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { mode: 'thisMonth', customStart: '', customEnd: '' };
    const parsed = JSON.parse(raw);
    return {
      mode: ['thisMonth', 'lastMonth', 'allTime', 'custom'].includes(parsed.mode) ? parsed.mode : 'thisMonth',
      customStart: parsed.customStart || '',
      customEnd: parsed.customEnd || '',
    };
  } catch {
    return { mode: 'thisMonth', customStart: '', customEnd: '' };
  }
}

export const dateFilter = writable(load());

dateFilter.subscribe((v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
});

export function setMode(mode) {
  dateFilter.update((s) => ({ ...s, mode }));
}

export function setCustomRange(customStart, customEnd) {
  dateFilter.update((s) => ({ ...s, mode: 'custom', customStart, customEnd }));
}

// Pure: { mode, customStart, customEnd } + now -> { start, end } ms
// (end exclusive), or null for 'allTime' / an incomplete custom range.
export function rangeBounds(filter, now = Date.now()) {
  const d = new Date(now);
  if (filter.mode === 'thisMonth') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    return { start, end };
  }
  if (filter.mode === 'lastMonth') {
    const start = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
    const end = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    return { start, end };
  }
  if (filter.mode === 'custom') {
    if (!filter.customStart || !filter.customEnd) return null;
    const start = new Date(`${filter.customStart}T00:00:00`).getTime();
    const end = new Date(`${filter.customEnd}T00:00:00`).getTime() + 24 * 60 * 60 * 1000;
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return { start, end };
  }
  return null; // allTime
}
