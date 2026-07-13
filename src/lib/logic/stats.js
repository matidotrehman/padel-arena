// Pure stat derivations from a player's stored record.

export function winRate(p) {
  if (!p.matchesPlayed) return 0;
  return Math.round((p.wins / p.matchesPlayed) * 100);
}

export function pointDiff(p) {
  return p.pointsWon - p.pointsConceded;
}

// Current streak: positive = win streak, negative = loss streak.
export function currentStreak(p) {
  const r = p.results;
  if (!r.length) return 0;
  const last = r[r.length - 1];
  let n = 0;
  for (let i = r.length - 1; i >= 0 && r[i] === last; i--) n++;
  return last === 'W' ? n : -n;
}

// Form emoji + label from the current streak.
export function form(p) {
  const s = currentStreak(p);
  if (s >= 3) return { icon: '🔥', label: `${s}W streak`, tone: 'hot' };
  if (s === 2) return { icon: '📈', label: '2W', tone: 'up' };
  if (s <= -3) return { icon: '❄️', label: `${-s}L slump`, tone: 'ice' };
  if (s === -2) return { icon: '📉', label: '2L', tone: 'down' };
  if (s === 1) return { icon: '✅', label: 'Won last', tone: 'up' };
  if (s === -1) return { icon: '➖', label: 'Lost last', tone: 'down' };
  return { icon: '·', label: 'No games', tone: 'neutral' };
}

export function avgConceded(p) {
  if (!p.matchesPlayed) return 0;
  return +(p.pointsConceded / p.matchesPlayed).toFixed(1);
}

// Average points scored per game — the Americano ranking metric.
export function avgPoints(p) {
  if (!p.matchesPlayed) return 0;
  return +(p.pointsWon / p.matchesPlayed).toFixed(1);
}

// Leaderboard order. mode 'points' → avg points/game first; mode 'winrate' →
// win % first. Remaining keys break ties. Players with no games sort last.
export function rankedPlayers(players, mode = 'points') {
  const keys = mode === 'winrate' ? [winRate, pointDiff, avgPoints] : [avgPoints, winRate, pointDiff];
  return [...players].sort((a, b) => {
    for (const k of keys) {
      const d = k(b) - k(a);
      if (d) return d;
    }
    return a.matchesPlayed - b.matchesPlayed;
  });
}
