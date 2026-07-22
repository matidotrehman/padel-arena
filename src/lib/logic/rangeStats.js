// Pure per-range stat computation. Replays a (typically already date-filtered)
// list of matches through the exact same reducer the lifetime store uses
// (store.js#applyMatch), so results are guaranteed identical to lifetime
// stats when given the unfiltered match list — no duplicated business logic.
import { applyMatch } from '../stores/store.js';

function zeroedFrom(p) {
  return {
    id: p.id,
    name: p.name,
    avatarColor: p.avatarColor,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    pointsWon: 0,
    pointsConceded: 0,
    chokes: 0,
    results: [],
  };
}

// Returns fresh player-shaped stat objects (same shape as persisted players)
// computed from just `matches`, without touching the real store/players.
export function computeStatsForMatches(matches, players) {
  const byId = Object.fromEntries(players.map((p) => [p.id, zeroedFrom(p)]));
  const ordered = [...(matches || [])].sort((a, b) => (a.date || 0) - (b.date || 0));
  for (const m of ordered) applyMatch(byId, m);
  return Object.values(byId);
}
