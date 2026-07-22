// Ranks every possible 2-player partnership by win rate when they've played
// as a team — for 6 players that's all C(6,2) = 15 pairs. Built entirely on
// h2h.js's existing bookkeeping (partW/partL), which already only counts
// team-based games (Fixed 2v2 + Americano rounds).
import { headToHead, record } from './h2h.js';

const MIN_PARTNER_GAMES = 2; // below this, a pair's win rate is noise, not signal

export function computeChemistry(players, matches) {
  const h = headToHead(matches);
  const pairs = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      const rec = record(h, a.id, b.id);
      const games = rec.partW + rec.partL;
      const tested = games >= MIN_PARTNER_GAMES;
      pairs.push({
        a,
        b,
        wins: rec.partW,
        losses: rec.partL,
        games,
        winRate: tested ? Math.round((rec.partW / games) * 100) : null,
        tested,
      });
    }
  }

  const ranked = pairs
    .filter((p) => p.tested)
    .sort((x, y) => y.winRate - x.winRate || y.games - x.games);
  const untested = pairs.filter((p) => !p.tested);

  return { ranked, untested };
}
