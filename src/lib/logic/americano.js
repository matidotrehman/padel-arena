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
  const n = playerIds.length;
  // Best achievable consecutive-play streak: with (n-4) resting each round a
  // player can't be benched more often than that allows. n<=4 → nobody rests.
  const streakFloor = n <= 4 ? rounds : Math.max(1, Math.ceil(4 / (n - 4)));

  // Small groups have the tightest combinatorics (fewest distinct games to
  // draw from), so satisfying every constraint at once takes more tries.
  const ATTEMPTS = n <= 6 ? 400 : n <= 8 ? 150 : 60;
  let best = null;
  let bestCost = Infinity;
  for (let t = 0; t < ATTEMPTS; t++) {
    const cand = buildSchedule(playerIds, rounds);
    const f = cand.fairness;
    const identicalGames = cand.rounds.length - Object.keys(f.matchupCount).length;
    const rv = Object.values(f.restCount);
    const restSpread = Math.max(...rv) - Math.min(...rv);
    // Priority: no duplicate games > balanced rest > no back-to-back bench >
    // no back-to-back partners > even opponents > short play streaks > even partners.
    const cost =
      identicalGames * 10_000_000 +
      restSpread * 1_000_000 +
      f.backToBackBench * 100_000 +
      f.backToBackPartner * 30_000 +
      f.oppSpread * 2_000 +
      f.maxConsec * 500 +
      f.partnerSpread * 100;
    if (cost < bestCost) {
      bestCost = cost;
      best = cand;
      // Ideal: no dups, balanced rest, no back-to-backs, tight streaks.
      if (
        identicalGames === 0 &&
        restSpread <= 1 &&
        f.backToBackBench === 0 &&
        f.backToBackPartner === 0 &&
        f.maxConsec <= streakFloor
      )
        break;
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
  const consec = Object.fromEntries(ids.map((id) => [id, 0])); // consecutive rounds played
  let maxConsec = 0;

  // Smoothness trackers (previous round).
  let lastResters = [];
  let lastPartnerKeys = new Set();
  let backToBackBench = 0; // times a player was benched two rounds running
  let backToBackPartner = 0; // times a partnership repeated in consecutive rounds

  const inc = (map, k) => (map[k] = (map[k] || 0) + 1);
  const get = (map, k) => map[k] || 0;
  const activeCombos = combinations(ids, 4);

  const schedule = [];

  for (let r = 0; r < rounds; r++) {
    // Score every (who-plays × pairing) candidate. Priority (high → low):
    //   no replayed game  >  rest balance  >  no back-to-back bench  >
    //   no back-to-back partners  >  no long play streak  >  partner spread  >
    //   opponent spread.
    // Duplicate-avoidance comes FIRST even in this per-round greedy step: a
    // rest imbalance can still be corrected in a later round, but a duplicate
    // game, once played, can never be undone — so it must never lose to any
    // other consideration, including rest balance.
    let bestScore = Infinity;
    let bestChoices = [];
    for (const active of activeCombos) {
      const resters = ids.filter((id) => !active.includes(id));
      // Rest spread if these players sit out — computed without cloning.
      let mx = -1;
      let mn = Infinity;
      for (const id of ids) {
        const v = restCount[id] + (resters.includes(id) ? 1 : 0);
        if (v > mx) mx = v;
        if (v < mn) mn = v;
      }
      const restSpread = mx - mn;
      const consecRest = resters.filter((id) => lastResters.includes(id)).length; // back-to-back bench
      let maxActiveStreak = 0;
      for (const id of active) if (consec[id] + 1 > maxActiveStreak) maxActiveStreak = consec[id] + 1;

      for (const [teamA, teamB] of pairingsOf(active)) {
        const pkA = pairKey(...teamA);
        const pkB = pairKey(...teamB);
        const partnerRepeat = get(partnerCount, pkA) + get(partnerCount, pkB);
        const consecPartner = (lastPartnerKeys.has(pkA) ? 1 : 0) + (lastPartnerKeys.has(pkB) ? 1 : 0);
        let oppRepeat = 0;
        for (const a of teamA) for (const b of teamB) oppRepeat += get(opponentCount, pairKey(a, b));
        const mk = matchupKey(teamA, teamB);
        const matchupRepeat = get(matchupCount, mk);

        const score =
          matchupRepeat * 10_000_000 +
          restSpread * 1_000_000 +
          consecRest * 10_000 +
          consecPartner * 3_000 +
          maxActiveStreak * 500 +
          partnerRepeat * 120 +
          oppRepeat * 60;

        if (score < bestScore) {
          bestScore = score;
          bestChoices = [{ resters, teamA, teamB, mk, pkA, pkB }];
        } else if (score === bestScore) {
          bestChoices.push({ resters, teamA, teamB, mk, pkA, pkB });
        }
      }
    }
    const best = bestChoices[Math.floor(Math.random() * bestChoices.length)];

    // Commit round.
    inc(partnerCount, best.pkA);
    inc(partnerCount, best.pkB);
    for (const a of best.teamA) for (const b of best.teamB) inc(opponentCount, pairKey(a, b));
    inc(matchupCount, best.mk);
    backToBackBench += best.resters.filter((id) => lastResters.includes(id)).length;
    backToBackPartner += (lastPartnerKeys.has(best.pkA) ? 1 : 0) + (lastPartnerKeys.has(best.pkB) ? 1 : 0);
    for (const id of best.resters) {
      restCount[id]++;
      consec[id] = 0;
    }
    for (const id of ids.filter((x) => !best.resters.includes(x))) {
      playCount[id]++;
      consec[id]++;
      if (consec[id] > maxConsec) maxConsec = consec[id];
    }
    lastResters = best.resters;
    lastPartnerKeys = new Set([best.pkA, best.pkB]);

    schedule.push({
      round: r + 1,
      teamA: best.teamA,
      teamB: best.teamB,
      resting: best.resters,
      scoreA: null,
      scoreB: null,
    });
  }

  // Global balance spreads (over all possible pairs, so never-met counts as 0).
  const allPairKeys = combinations(ids, 2).map(([a, b]) => pairKey(a, b));
  const spread = (map) => {
    const vals = allPairKeys.map((k) => map[k] || 0);
    return Math.max(...vals) - Math.min(...vals);
  };

  return {
    rounds: schedule,
    fairness: {
      partnerCount,
      opponentCount,
      matchupCount,
      restCount,
      playCount,
      maxConsec,
      backToBackBench,
      backToBackPartner,
      oppSpread: spread(opponentCount),
      partnerSpread: spread(partnerCount),
    },
  };
}

// A round counts only if it was actually played: both scores entered and not
// 0–0. Padel games never end 0–0, so a blank/0–0 round means "not played" and
// is excluded from stats so it can't unfairly affect anyone's points.
export function roundPlayed(r) {
  return !!r && r.scoreA != null && r.scoreB != null && +r.scoreA + +r.scoreB > 0;
}

// Tally per-player points from a completed/in-progress session's rounds.
// In Americano, each player earns the points their team scored that game.
export function sessionTotals(rounds, playerIds) {
  const totals = Object.fromEntries(playerIds.map((id) => [id, { points: 0, conceded: 0, games: 0, wins: 0 }]));
  for (const g of rounds) {
    if (!roundPlayed(g)) continue;
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
