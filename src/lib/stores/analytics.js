// Date-range-scoped derived views, layered on top of the lifetime store
// (store.js) without altering it. Everything here is read-only/derived.
import { derived } from 'svelte/store';
import { matches, players } from './store.js';
import { rankMode } from './prefs.js';
import { dateFilter, rangeBounds } from './dateFilter.js';
import { computeStatsForMatches } from '../logic/rangeStats.js';
import { rankedPlayers } from '../logic/stats.js';

export const filteredMatches = derived([matches, dateFilter], ([$m, $f]) => {
  const range = rangeBounds($f);
  if (!range) return $m;
  return $m.filter((m) => (m.date || 0) >= range.start && (m.date || 0) < range.end);
});

export const rangeStats = derived([filteredMatches, players], ([$fm, $p]) => computeStatsForMatches($fm, $p));

export const rangeRanked = derived([rangeStats, rankMode], ([$rs, $m]) => rankedPlayers($rs, $m));
