// 6-player Americano schedule generator (single court).
//
// Reality check: with 6 players and whole 2v2 games, it's mathematically
// impossible for everyone to partner everyone *exactly* once (that needs 7.5
// games). So the goal is a *balanced* rotation: partner counts as even as
// possible, opponent counts spread out, and rest turns shared equally.
//
// The generator is greedy + fully deterministic (fixed tie-breaks), so the
// same 6 players always produce the same fair schedule.

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// All ways to split 4 players into two pairs (3 distinct pairings).
function pairingsOf([a, b, c, d]) {
  return [
    [[a, b], [c, d]],
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ];
}

// Suggested number of rounds for a time slot. ~11 min per game.
export function suggestedRounds(minutes = 150) {
  return Math.max(4, Math.round(minutes / 11));
}

/**
 * @param {string[]} playerIds - exactly 6 player ids
 * @param {number} rounds - number of games (each game rests 2 players)
 * @returns {{ rounds: Array, fairness: object }}
 */
export function generateSchedule(playerIds, rounds = 14) {
  const ids = [...playerIds];
  if (ids.length !== 6) {
    throw new Error('The Americano mixer is tuned for exactly 6 players.');
  }

  const partnerCount = {}; // "a|b" -> times partnered
  const opponentCount = {}; // "a|b" -> times opposed
  const restCount = Object.fromEntries(ids.map((id) => [id, 0]));
  const playCount = Object.fromEntries(ids.map((id) => [id, 0]));

  const inc = (map, k) => (map[k] = (map[k] || 0) + 1);
  const get = (map, k) => map[k] || 0;

  const schedule = [];

  for (let r = 0; r < rounds; r++) {
    // 1) Pick the 2 resters: those who have rested least (then played most),
    //    deterministic final tie-break on id order.
    const restOrder = [...ids].sort((x, y) => {
      if (restCount[x] !== restCount[y]) return restCount[x] - restCount[y];
      if (playCount[y] !== playCount[x]) return playCount[y] - playCount[x];
      return ids.indexOf(x) - ids.indexOf(y);
    });
    const resters = restOrder.slice(0, 2);
    const active = ids.filter((id) => !resters.includes(id));

    // 2) Among the 4 active, choose the pairing that minimizes partner repeats,
    //    then opponent repeats.
    let best = null;
    for (const [teamA, teamB] of pairingsOf(active)) {
      const partnerRepeat = get(partnerCount, pairKey(...teamA)) + get(partnerCount, pairKey(...teamB));
      let oppRepeat = 0;
      for (const a of teamA) for (const b of teamB) oppRepeat += get(opponentCount, pairKey(a, b));
      const score = partnerRepeat * 100 + oppRepeat; // partner balance dominates
      if (!best || score < best.score) best = { teamA, teamB, score };
    }

    // 3) Commit round.
    inc(partnerCount, pairKey(...best.teamA));
    inc(partnerCount, pairKey(...best.teamB));
    for (const a of best.teamA) for (const b of best.teamB) inc(opponentCount, pairKey(a, b));
    for (const id of active) playCount[id]++;
    for (const id of resters) restCount[id]++;

    schedule.push({
      round: r + 1,
      teamA: best.teamA,
      teamB: best.teamB,
      resting: resters,
      scoreA: null,
      scoreB: null,
    });
  }

  return {
    rounds: schedule,
    fairness: { partnerCount, opponentCount, restCount, playCount },
  };
}

// Tally per-player points from a completed/in-progress session's rounds.
// In Americano, each player earns the points their team scored that game.
export function sessionTotals(rounds, playerIds) {
  const totals = Object.fromEntries(playerIds.map((id) => [id, { points: 0, conceded: 0, games: 0, wins: 0 }]));
  for (const g of rounds) {
    if (g.scoreA == null || g.scoreB == null) continue;
    const a = +g.scoreA;
    const b = +g.scoreB;
    for (const id of g.teamA) {
      totals[id].points += a;
      totals[id].conceded += b;
      totals[id].games += 1;
      if (a > b) totals[id].wins += 1;
    }
    for (const id of g.teamB) {
      totals[id].points += b;
      totals[id].conceded += a;
      totals[id].games += 1;
      if (b > a) totals[id].wins += 1;
    }
  }
  return totals;
}
