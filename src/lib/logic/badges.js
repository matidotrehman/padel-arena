import { currentStreak, pointDiff, avgConceded, winRate } from './stats.js';

// Each badge picks a single winner among eligible players.
// Returns [{ key, title, icon, blurb, winner: player|null, value }].

export const BADGE_DEFS = [
  {
    key: 'smash-master',
    title: 'The Smash Master',
    icon: '💥',
    blurb: 'Highest active win streak',
    accent: '#b6ff2e',
  },
  {
    key: 'silent-killer',
    title: 'Silent Killer',
    icon: '🔪',
    blurb: 'Best point differential',
    accent: '#22e0c8',
  },
  {
    key: 'el-gato',
    title: 'El Gato',
    icon: '🐈‍⬛',
    blurb: 'Fewest points conceded / match',
    accent: '#56c8ff',
  },
  {
    key: 'choke-artist',
    title: 'Choke Artist',
    icon: '🫣',
    blurb: 'Most matches lost after leading',
    accent: '#ff5e3a',
  },
];

function bestBy(players, scoreFn, { min = -Infinity } = {}) {
  let best = null;
  let bestScore = -Infinity;
  for (const p of players) {
    if (!p.matchesPlayed) continue;
    const s = scoreFn(p);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  if (!best || bestScore <= min) return { winner: null, value: bestScore };
  return { winner: best, value: bestScore };
}

export function computeBadges(players) {
  return BADGE_DEFS.map((def) => {
    let res;
    switch (def.key) {
      case 'smash-master': {
        // only positive active streaks qualify
        res = bestBy(players, (p) => Math.max(0, currentStreak(p)), { min: 0 });
        return { ...def, winner: res.winner, value: res.winner ? `${res.value}W` : '—' };
      }
      case 'silent-killer': {
        res = bestBy(players, pointDiff, { min: 0 });
        return { ...def, winner: res.winner, value: res.winner ? `+${res.value}` : '—' };
      }
      case 'el-gato': {
        // fewest conceded per match → maximize the negative
        res = bestBy(players, (p) => -avgConceded(p));
        return { ...def, winner: res.winner, value: res.winner ? `${avgConceded(res.winner)}/m` : '—' };
      }
      case 'choke-artist': {
        res = bestBy(players, (p) => p.chokes ?? 0, { min: 0 });
        return { ...def, winner: res.winner, value: res.winner ? `${res.value}×` : '—' };
      }
      default:
        return { ...def, winner: null, value: '—' };
    }
  });
}

export { winRate };
