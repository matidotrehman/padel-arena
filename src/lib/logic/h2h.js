// Head-to-head records derived from match history.
//
// For every ordered pair (a, b) we track how a has done:
//   - AS OPPONENTS: wins / losses / points-for / points-against vs b
//   - AS PARTNERS:  wins / losses when playing on the same team as b
//
// Only team-based games count (Fixed 2v2 + Americano rounds); Individual-mode
// matches have no teams, so they're skipped for H2H.
import { fixedOutcome } from '../stores/store.js';

function teamPairs(team) {
  const out = [];
  for (let i = 0; i < team.length; i++) for (let j = i + 1; j < team.length; j++) out.push([team[i], team[j]]);
  return out;
}

export function headToHead(matches) {
  const h = {};
  const cell = (a, b) => {
    (h[a] ||= {});
    (h[a][b] ||= { oppW: 0, oppL: 0, oppPF: 0, oppPA: 0, partW: 0, partL: 0 });
    return h[a][b];
  };

  const applyGame = (teamA, teamB, pfA, pfB, winner) => {
    const aWon = winner === 'A';
    const bWon = winner === 'B';

    // Partners (same team).
    for (const [x, y] of teamPairs(teamA)) {
      if (aWon) { cell(x, y).partW++; cell(y, x).partW++; }
      else if (bWon) { cell(x, y).partL++; cell(y, x).partL++; }
    }
    for (const [x, y] of teamPairs(teamB)) {
      if (bWon) { cell(x, y).partW++; cell(y, x).partW++; }
      else if (aWon) { cell(x, y).partL++; cell(y, x).partL++; }
    }

    // Opponents (opposite teams).
    for (const x of teamA) {
      for (const y of teamB) {
        const cxy = cell(x, y);
        const cyx = cell(y, x);
        cxy.oppPF += pfA; cxy.oppPA += pfB;
        cyx.oppPF += pfB; cyx.oppPA += pfA;
        if (aWon) { cxy.oppW++; cyx.oppL++; }
        else if (bWon) { cxy.oppL++; cyx.oppW++; }
      }
    }
  };

  for (const m of matches || []) {
    if (m.mode === 'fixed') {
      const o = fixedOutcome(m);
      applyGame(m.teamA || [], m.teamB || [], o.scoreA, o.scoreB, o.aWins ? 'A' : 'B');
    } else if (m.mode === 'americano') {
      for (const r of m.rounds || []) {
        if (r.scoreA == null || r.scoreB == null) continue;
        const a = +r.scoreA;
        const b = +r.scoreB;
        applyGame(r.teamA || [], r.teamB || [], a, b, a > b ? 'A' : b > a ? 'B' : 'draw');
      }
    }
  }

  return h;
}

const EMPTY = { oppW: 0, oppL: 0, oppPF: 0, oppPA: 0, partW: 0, partL: 0 };

// Record of `aId` relative to `bId` (safe when the pair never met).
export function record(h, aId, bId) {
  return (h[aId] && h[aId][bId]) || EMPTY;
}

export function totalEncounters(rec) {
  return rec.oppW + rec.oppL + rec.partW + rec.partL;
}
