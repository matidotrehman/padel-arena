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

// Leaderboard order: avg points/game desc, then win rate, then point diff, then
// fewer games. Players with no games sort last.
export function rankedPlayers(players) {
  return [...players].sort((a, b) => {
    const ap = avgPoints(b) - avgPoints(a);
    if (ap) return ap;
    const wr = winRate(b) - winRate(a);
    if (wr) return wr;
    const pd = pointDiff(b) - pointDiff(a);
    if (pd) return pd;
    return a.matchesPlayed - b.matchesPlayed;
  });
}
