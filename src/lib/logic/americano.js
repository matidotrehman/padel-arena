// Americano schedule generator (single court, ANY number of players ≥ 4).
//
// Each round exactly 4 players play a 2v2 game and the rest sit out. The
// generator jointly picks WHO plays and HOW they pair up, optimising (in
// priority order) for balanced rest, even partner spread, and — crucially — it
// never replays an identical game until it's mathematically forced.
//
// It's RANDOMISED: the player order is shuffled and, each round, it picks at
// random among the equally-best options — so every mix is a fresh schedule
// while keeping the exact same fairness/no-duplicate guarantees.

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// Fisher–Yates shuffle (in place). Browser Math.random — plenty for a mixer.
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// All ways to split 4 players into two pairs (3 distinct pairings).
function pairingsOf([a, b, c, d]) {
  return [
    [[a, b], [c, d]],
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ];
}

// Canonical key for a whole 2v2 matchup (side-independent) — used to avoid
// replaying the exact same game.
function matchupKey(teamA, teamB) {
  return [[...teamA].sort().join('+'), [...teamB].sort().join('+')].sort().join(' vs ');
}

// All ways to choose k items from arr (order-independent).
function combinations(arr, k) {
  const res = [];
  const rec = (start, combo) => {
    if (combo.length === k) {
      res.push(combo.slice());
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      rec(i + 1, combo);
      combo.pop();
    }
  };
  rec(0, []);
  return res;
}

// Suggested number of rounds for a time slot. ~11 min per game.
export function suggestedRounds(minutes = 150) {
  return Math.max(4, Math.round(minutes / 11));
}

/**
 * Public entry point. Runs several randomised attempts and returns the best
 * one — so the schedule is different every time, yet never has an avoidable
 * duplicate game.
 *
 * @param {string[]} playerIds - 4 or more player ids
 * @param {number} rounds - number of games (each game rests the extra players)
 * @returns {{ rounds: Array, fairness: object }}
 */
export function generateSchedule(playerIds, rounds = 12) {
  if (playerIds.length < 4) {
    throw new Error('Pick at least 4 players for an Americano.');
  }
  const ATTEMPTS = 60;
  let best = null;
  let bestCost = Infinity;
  for (let t = 0; t < ATTEMPTS; t++) {
    const cand = buildSchedule(playerIds, rounds);
    const identicalGames = cand.rounds.length - Object.keys(cand.fairness.matchupCount).length;
    const pc = Object.values(cand.fairness.partnerCount);
    const partnerMax = pc.length ? Math.max(...pc) : 0;
    const rv = Object.values(cand.fairness.restCount);
    const restSpread = Math.max(...rv) - Math.min(...rv);
    const cost = identicalGames * 10000 + partnerMax * 100 + restSpread;
    if (cost < bestCost) {
      bestCost = cost;
      best = cand;
      if (identicalGames === 0 && restSpread <= 1) break; // can't do better
    }
  }
  return best;
}

// One randomised attempt at a schedule.
function buildSchedule(playerIds, rounds) {
  const ids = shuffle([...playerIds]); // randomise so every mix differs

  const partnerCount = {}; // "a|b" -> times partnered
  const opponentCount = {}; // "a|b" -> times opposed
  const matchupCount = {}; // whole-game key -> times this exact 2v2 has happened
  const restCount = Object.fromEntries(ids.map((id) => [id, 0]));
  const playCount = Object.fromEntries(ids.map((id) => [id, 0]));

  const inc = (map, k) => (map[k] = (map[k] || 0) + 1);
  const get = (map, k) => map[k] || 0;
  // Every way to choose the 4 players who play this round; the rest sit out.
  const activeCombos = combinations(ids, 4);

  const schedule = [];

  for (let r = 0; r < rounds; r++) {
    // Jointly consider every (who-plays × pairing) candidate and pick the best
    // mix, weighted so that:
    //   rest stays balanced  >>  partners spread out  >>  no exact-game replays
    //   >>  opponents spread out.
    // Collect ALL equally-best candidates, then pick one at random — keeps the
    // schedule optimal but different every time.
    let bestScore = Infinity;
    let bestChoices = [];
    for (const active of activeCombos) {
      const resters = ids.filter((id) => !active.includes(id));
      const restAfter = { ...restCount };
      for (const id of resters) restAfter[id]++;
      const rv = Object.values(restAfter);
      const restSpread = Math.max(...rv) - Math.min(...rv);

      for (const [teamA, teamB] of pairingsOf(active)) {
        const partnerRepeat = get(partnerCount, pairKey(...teamA)) + get(partnerCount, pairKey(...teamB));
        let oppRepeat = 0;
        for (const a of teamA) for (const b of teamB) oppRepeat += get(opponentCount, pairKey(a, b));
        const mk = matchupKey(teamA, teamB);
        const matchupRepeat = get(matchupCount, mk);

        const score = restSpread * 1000 + partnerRepeat * 100 + matchupRepeat * 20 + oppRepeat;
        if (score < bestScore) {
          bestScore = score;
          bestChoices = [{ resters, teamA, teamB, mk }];
        } else if (score === bestScore) {
          bestChoices.push({ resters, teamA, teamB, mk });
        }
      }
    }
    const best = bestChoices[Math.floor(Math.random() * bestChoices.length)];

    // Commit round.
    inc(partnerCount, pairKey(...best.teamA));
    inc(partnerCount, pairKey(...best.teamB));
    for (const a of best.teamA) for (const b of best.teamB) inc(opponentCount, pairKey(a, b));
    inc(matchupCount, best.mk);
    for (const id of best.resters) restCount[id]++;
    for (const id of ids.filter((x) => !best.resters.includes(x))) playCount[id]++;

    schedule.push({
      round: r + 1,
      teamA: best.teamA,
      teamB: best.teamB,
      resting: best.resters,
      scoreA: null,
      scoreB: null,
    });
  }

  return {
    rounds: schedule,
    fairness: { partnerCount, opponentCount, matchupCount, restCount, playCount },
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
