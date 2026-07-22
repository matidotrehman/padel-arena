// Dynamic, date-range-scoped badges. All computation takes an already
// range-filtered player-stats list + match list (see stores/analytics.js) —
// nothing here reads the lifetime store directly, so results always reflect
// whichever timeframe the dashboard's date filter is set to.
import { rankedPlayers, pointDiff, winRate, avgPoints } from './stats.js';
import { roundPlayed } from './americano.js';
import { headToHead } from './h2h.js';
import { fixedOutcome } from '../stores/store.js';

export const BADGE_DEFS = [
  { key: 'el-rey', title: 'El Rey', icon: '👑', blurb: '#1 on the leaderboard', accent: '#FFD700' },
  { key: 'on-fire', title: 'On Fire', icon: '🔥', blurb: '3+ match win streak in a single session', accent: '#F97316' },
  { key: 'brick-wall', title: 'Brick Wall', icon: '🛡️', blurb: 'Best point differential', accent: '#10B981' },
  { key: 'ideal-partner', title: 'Ideal Partner', icon: '🤝', blurb: 'Best win rate across different teammates', accent: '#34D399' },
  { key: 'under-construction', title: 'Under Construction', icon: '🚧', blurb: 'Bottom of the leaderboard', accent: '#F59E0B' },
  { key: 'ice-cold', title: 'Ice Cold', icon: '🧊', blurb: '3+ match losing streak in a single session', accent: '#38BDF8' },
  { key: 'rollercoaster', title: 'Rollercoaster', icon: '🎢', blurb: 'Wins big, loses big — highest score variance', accent: '#A78BFA' },
  { key: 'wooden-paddle', title: 'Wooden Paddle', icon: '🪵', blurb: 'Lowest point differential', accent: '#92400E' },
];

function played(players) {
  return players.filter((p) => p.matchesPlayed > 0);
}

// Longest in-session win/loss streak per player, across every Americano
// session in `matches` — "session" per the spec means a single mixer, so a
// streak never carries over from one session into the next.
function sessionStreaks(matches) {
  const bestWin = {};
  const bestLoss = {};
  for (const m of matches) {
    if (m.mode !== 'americano') continue;
    const cur = {}; // id -> { win, loss }
    for (const g of (m.rounds || []).filter(roundPlayed)) {
      const a = +g.scoreA;
      const b = +g.scoreB;
      if (a === b) continue;
      const aWon = a > b;
      const bump = (id, won) => {
        const s = cur[id] || { win: 0, loss: 0 };
        if (won) {
          s.win += 1;
          s.loss = 0;
        } else {
          s.loss += 1;
          s.win = 0;
        }
        cur[id] = s;
        bestWin[id] = Math.max(bestWin[id] || 0, s.win);
        bestLoss[id] = Math.max(bestLoss[id] || 0, s.loss);
      };
      for (const id of g.teamA || []) bump(id, aWon);
      for (const id of g.teamB || []) bump(id, !aWon);
    }
  }
  return { bestWin, bestLoss };
}

function bestStreakBadge(streakMap, byId, fmt) {
  let winner = null;
  let val = 2; // must be 3+ to qualify
  for (const [id, v] of Object.entries(streakMap)) {
    if (v > val && byId[id]) {
      val = v;
      winner = byId[id];
    }
  }
  return winner ? { winner, value: fmt(val) } : { winner: null };
}

// Per-game point differentials for team-based games only (fixed + americano
// rounds) — individual mode has no teams, same convention h2h.js uses.
function perGameDiffs(matches) {
  const diffs = {};
  const push = (id, d) => {
    (diffs[id] ||= []).push(d);
  };
  for (const m of matches) {
    if (m.mode === 'fixed') {
      const o = fixedOutcome(m);
      for (const id of m.teamA || []) push(id, o.scoreA - o.scoreB);
      for (const id of m.teamB || []) push(id, o.scoreB - o.scoreA);
    } else if (m.mode === 'americano') {
      for (const g of m.rounds || []) {
        if (!roundPlayed(g)) continue;
        const a = +g.scoreA;
        const b = +g.scoreB;
        for (const id of g.teamA || []) push(id, a - b);
        for (const id of g.teamB || []) push(id, b - a);
      }
    }
  }
  return diffs;
}

function variance(arr) {
  const mean = arr.reduce((s, x) => s + x, 0) / arr.length;
  return arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
}

function idealPartner(matches, byId) {
  const h = headToHead(matches);
  let winner = null;
  let bestRate = -1;
  let bestValue = null;
  for (const id of Object.keys(byId)) {
    const opp = h[id] || {};
    let w = 0;
    let l = 0;
    let distinctPartners = 0;
    for (const rec of Object.values(opp)) {
      const g = rec.partW + rec.partL;
      if (g > 0) {
        distinctPartners += 1;
        w += rec.partW;
        l += rec.partL;
      }
    }
    const total = w + l;
    if (distinctPartners < 2 || total < 3) continue;
    const rate = w / total;
    if (rate > bestRate) {
      bestRate = rate;
      winner = byId[id];
      bestValue = Math.round(rate * 100);
    }
  }
  return winner ? { winner, value: `${bestValue}%` } : { winner: null };
}

/**
 * @param {Array} rangeStatsPlayers - player-shaped stat objects scoped to the
 *   active date range (see logic/rangeStats.js).
 * @param {Array} filteredMatches - matches within that same date range.
 * @param {'points'|'winrate'} rankMode - the leaderboard's active sort mode,
 *   so El Rey / Under Construction match whatever "#1" means on screen.
 */
export function computeBadges(rangeStatsPlayers, filteredMatches, rankMode = 'points') {
  const byId = Object.fromEntries(rangeStatsPlayers.map((p) => [p.id, p]));
  const playedPlayers = played(rangeStatsPlayers);
  const results = {};

  // El Rey / Under Construction — top/bottom of the ranked leaderboard.
  const ranked = rankedPlayers(playedPlayers, rankMode);
  const metric = (p) => (rankMode === 'winrate' ? `${winRate(p)}%` : `${avgPoints(p)} pg`);
  results['el-rey'] = ranked.length ? { winner: ranked[0], value: metric(ranked[0]) } : { winner: null };
  results['under-construction'] =
    ranked.length >= 2 ? { winner: ranked[ranked.length - 1], value: metric(ranked[ranked.length - 1]) } : { winner: null };

  // Brick Wall / Wooden Paddle — best/worst point differential.
  if (playedPlayers.length) {
    const byDiff = [...playedPlayers].sort((a, b) => pointDiff(b) - pointDiff(a));
    const fmt = (p) => `${pointDiff(p) >= 0 ? '+' : ''}${pointDiff(p)}`;
    results['brick-wall'] = { winner: byDiff[0], value: fmt(byDiff[0]) };
    results['wooden-paddle'] = byDiff.length >= 2 ? { winner: byDiff[byDiff.length - 1], value: fmt(byDiff[byDiff.length - 1]) } : { winner: null };
  } else {
    results['brick-wall'] = { winner: null };
    results['wooden-paddle'] = { winner: null };
  }

  // On Fire / Ice Cold — longest in-session win/loss streak.
  const { bestWin, bestLoss } = sessionStreaks(filteredMatches);
  results['on-fire'] = bestStreakBadge(bestWin, byId, (n) => `${n}W streak`);
  results['ice-cold'] = bestStreakBadge(bestLoss, byId, (n) => `${n}L streak`);

  // Rollercoaster — highest variance in per-game point differential.
  const diffs = perGameDiffs(filteredMatches);
  let rWinner = null;
  let rVar = -1;
  let rShown = null;
  for (const [id, arr] of Object.entries(diffs)) {
    if (arr.length < 3 || !byId[id]) continue;
    const v = variance(arr);
    if (v > rVar) {
      rVar = v;
      rWinner = byId[id];
      rShown = Math.round(Math.sqrt(v) * 10) / 10;
    }
  }
  results['rollercoaster'] = rWinner ? { winner: rWinner, value: `σ${rShown}` } : { winner: null };

  // Ideal Partner — best win rate across 2+ distinct partners.
  results['ideal-partner'] = idealPartner(filteredMatches, byId);

  return BADGE_DEFS.map((def) => {
    const r = results[def.key] || { winner: null };
    return { ...def, winner: r.winner, value: r.winner ? r.value : '—' };
  });
}
