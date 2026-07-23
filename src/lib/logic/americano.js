// Americano schedule generator — dynamic constrained-optimisation approach.
//
// Works for ANY player count N >= 4 and ANY round count R. Each round exactly
// 4 players play a 2v2 game; the remaining N-4 sit out. The generator is a
// two-phase local-search optimiser:
//
//   1. CONSTRUCT — one fast randomised greedy pass builds a reasonable
//      starting schedule, choosing (who plays x how they pair) round-by-round.
//   2. REFINE — a time-boxed local-search repair loop repeatedly re-rolls
//      individual rounds (trying every possible replacement for that round
//      alone, holding every other round fixed) and keeps any change that
//      lowers the whole schedule's cost. When a full sweep finds no further
//      improvement, it randomly "kicks" one round to a different option to
//      escape a local optimum, then keeps sweeping until the time budget runs
//      out. The best schedule seen at any point is always what gets returned,
//      even if a later kick made things temporarily worse.
//
// This targets exactly the fairness properties an Americano mixer needs:
//   - every player's sit-out count differs by at most 1 from every other
//     (dynamic target = R * (N-4) / N, the standard floor/ceil distribution)
//   - nobody sits out twice in a row, and no partnership repeats twice in a
//     row, unless mathematically unavoidable
//   - nobody plays more than 2 consecutive rounds without a rest (ideal
//     rhythm: Active, Active, Rest), unless mathematically unavoidable
//   - every 2v2 matchup ({A,B} vs {C,D}) is strictly unique across all rounds
//   - partnerships spread evenly (no "ghost pairs" at 0 while others are
//     over-coupled at 3+)
//   - opponent encounters spread evenly
//
// All of this is enforced by a single strictly-tiered cost function (see
// `costOf`), with each tier weighted roughly an order of magnitude above the
// maximum plausible total of every tier below it — so a higher-priority rule
// can never be sacrificed to improve a lower-priority one.

// No player may play more than this many rounds in a row without a rest —
// the ideal rhythm is Active, Active, Rest.
const MAX_CONSEC_ACTIVE = 2;

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// All 3 ways to split 4 players into two teams of 2.
function pairingsOf([a, b, c, d]) {
  return [
    [[a, b], [c, d]],
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ];
}

// Canonical, side-independent identity of a whole 2v2 game — used to keep
// every matchup unique across the schedule.
function matchupKey(teamA, teamB) {
  return [[...teamA].sort().join('+'), [...teamB].sort().join('+')].sort().join(' vs ');
}

// All k-combinations of arr (order-independent).
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

// Fisher–Yates shuffle (in place).
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Suggested number of rounds for a time slot. ~11 min per game.
export function suggestedRounds(minutes = 150) {
  return Math.max(4, Math.round(minutes / 11));
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

// =============================================================================
// Cost function
// =============================================================================

const PENALTY = {
  DUPLICATE_MATCHUP: 1_000_000_000, // an exact {A,B} vs {C,D} game repeating
  PARTNER_CAP_EXCESS: 200_000_000, // a pair partnering more than the hard cap allows
  BACK_TO_BACK_SIT: 20_000_000, // a player benched two rounds running
  BACK_TO_BACK_PARTNER: 4_000_000, // a partnership repeating in consecutive rounds
  SIT_SPREAD: 500_000, // per unit a player's sit-count is beyond the allowed +/-1 band
  CONSEC_PLAY_EXCESS: 100_000, // a player active for a 3rd+ round in a row (fatigue cap) —
  // below sit-spread on purpose: even rest distribution wins if the two ever conflict
  PARTNER_IMBALANCE: 40_000, // partner-count spread beyond 1, plus ghost/over-coupling
  OPPONENT_SPREAD: 8_000, // opponent-count spread beyond 1
  MAX_CONSEC_PLAY: 100, // longest unbroken run of rounds played (minor smoothness)
};

// Fully recompute every tracked statistic from a candidate schedule. This is
// O(rounds) and allocation-light, so it's cheap enough to call on every
// local-search trial (thousands of times per generation).
function evaluateSchedule(schedule, ids) {
  const sitCount = Object.fromEntries(ids.map((id) => [id, 0]));
  const partnerCount = {};
  const opponentCount = {};
  const matchupCount = {};
  const consecPlay = Object.fromEntries(ids.map((id) => [id, 0]));
  let maxConsecPlay = 0;
  let consecPlayExcess = 0;
  let backToBackSits = 0;
  let backToBackPartners = 0;
  let lastResting = null;
  let lastPartnerKeys = null;

  for (const g of schedule) {
    for (const id of g.resting) sitCount[id]++;
    if (lastResting) backToBackSits += g.resting.filter((id) => lastResting.includes(id)).length;

    const pkA = pairKey(...g.teamA);
    const pkB = pairKey(...g.teamB);
    if (lastPartnerKeys) {
      backToBackPartners += (lastPartnerKeys.has(pkA) ? 1 : 0) + (lastPartnerKeys.has(pkB) ? 1 : 0);
    }
    partnerCount[pkA] = (partnerCount[pkA] || 0) + 1;
    partnerCount[pkB] = (partnerCount[pkB] || 0) + 1;
    for (const a of g.teamA) {
      for (const b of g.teamB) {
        const k = pairKey(a, b);
        opponentCount[k] = (opponentCount[k] || 0) + 1;
      }
    }
    const mk = matchupKey(g.teamA, g.teamB);
    matchupCount[mk] = (matchupCount[mk] || 0) + 1;

    const active = new Set([...g.teamA, ...g.teamB]);
    for (const id of ids) {
      if (active.has(id)) {
        consecPlay[id]++;
        if (consecPlay[id] > maxConsecPlay) maxConsecPlay = consecPlay[id];
        if (consecPlay[id] > MAX_CONSEC_ACTIVE) consecPlayExcess++;
      } else {
        consecPlay[id] = 0;
      }
    }

    lastResting = g.resting;
    lastPartnerKeys = new Set([pkA, pkB]);
  }

  const duplicateMatchups = Object.values(matchupCount).reduce((s, c) => s + Math.max(0, c - 1), 0);

  const sitVals = ids.map((id) => sitCount[id]);
  const sitSpread = sitVals.length ? Math.max(...sitVals) - Math.min(...sitVals) : 0;

  const allPairs = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) allPairs.push(pairKey(ids[i], ids[j]));
  const partnerVals = allPairs.map((k) => partnerCount[k] || 0);
  const partnerMin = partnerVals.length ? Math.min(...partnerVals) : 0;
  const partnerMax = partnerVals.length ? Math.max(...partnerVals) : 0;
  const partnerSpread = partnerMax - partnerMin;
  // Specifically penalise "ghost pairs" (0 partnerships) coexisting with
  // over-coupled pairs (3+), beyond what the plain spread already captures.
  const overCoupled =
    partnerMin === 0 && partnerMax >= 2 ? partnerVals.filter((v) => v === partnerMax).length * (partnerMax - 1) : 0;

  const opponentVals = allPairs.map((k) => opponentCount[k] || 0);
  const opponentSpread = opponentVals.length ? Math.max(...opponentVals) - Math.min(...opponentVals) : 0;

  return {
    sitCount,
    partnerCount,
    opponentCount,
    matchupCount,
    duplicateMatchups,
    sitSpread,
    backToBackSits,
    backToBackPartners,
    partnerSpread,
    overCoupled,
    opponentSpread,
    maxConsecPlay,
    consecPlayExcess,
  };
}

// Quadratic cost for exceeding the hard partnership cap: (excess)^2 summed
// over every pair. This is weighted (PARTNER_CAP_EXCESS, between duplicate-
// avoidance and back-to-back-sit) high enough that the search essentially
// never lets any pair over the cap UNLESS doing so is the only way to avoid
// an even higher-priority violation — chiefly a duplicate game. That
// subordination matters: the cap is a strong preference, but "every 2v2
// matchup must be unique" is the one rule that must never be broken to
// satisfy it.
function capExcessCost(ev, partnerCap) {
  let cost = 0;
  for (const v of Object.values(ev.partnerCount)) {
    const excess = v - partnerCap;
    if (excess > 0) cost += excess * excess;
  }
  return cost;
}

function costOf(ev, partnerCap) {
  const sitSpreadExtra = Math.max(0, ev.sitSpread - 1);
  const partnerSpreadExtra = Math.max(0, ev.partnerSpread - 1) + ev.overCoupled;
  const opponentSpreadExtra = Math.max(0, ev.opponentSpread - 1);
  return (
    ev.duplicateMatchups * PENALTY.DUPLICATE_MATCHUP +
    capExcessCost(ev, partnerCap) * PENALTY.PARTNER_CAP_EXCESS +
    ev.backToBackSits * PENALTY.BACK_TO_BACK_SIT +
    ev.consecPlayExcess * PENALTY.CONSEC_PLAY_EXCESS +
    ev.backToBackPartners * PENALTY.BACK_TO_BACK_PARTNER +
    sitSpreadExtra * PENALTY.SIT_SPREAD +
    partnerSpreadExtra * PENALTY.PARTNER_IMBALANCE +
    opponentSpreadExtra * PENALTY.OPPONENT_SPREAD +
    ev.maxConsecPlay * PENALTY.MAX_CONSEC_PLAY
  );
}

// =============================================================================
// Phase 1 — construction: one randomised greedy pass
// =============================================================================

function buildInitialSchedule(playerIds, rounds, partnerCap) {
  const ids = shuffle([...playerIds]);
  const activeCombos = combinations(ids, 4);

  const sitCount = Object.fromEntries(ids.map((id) => [id, 0]));
  const partnerCount = {};
  const opponentCount = {};
  const matchupCount = {};
  const consecPlay = Object.fromEntries(ids.map((id) => [id, 0]));
  let lastResting = [];
  let lastPartnerKeys = new Set();
  const get = (map, k) => map[k] || 0;

  const schedule = [];

  for (let r = 0; r < rounds; r++) {
    let bestScore = Infinity;
    let bestChoices = [];

    for (const active of activeCombos) {
      const resting = ids.filter((id) => !active.includes(id));
      let mx = -Infinity;
      let mn = Infinity;
      for (const id of ids) {
        const v = sitCount[id] + (resting.includes(id) ? 1 : 0);
        if (v > mx) mx = v;
        if (v < mn) mn = v;
      }
      const sitSpread = mx - mn;
      const consecSit = resting.filter((id) => lastResting.includes(id)).length;
      let maxStreak = 0;
      let consecExcess = 0;
      for (const id of active) {
        const streak = consecPlay[id] + 1;
        if (streak > maxStreak) maxStreak = streak;
        if (streak > MAX_CONSEC_ACTIVE) consecExcess++;
      }

      for (const [teamA, teamB] of pairingsOf(active)) {
        const pkA = pairKey(...teamA);
        const pkB = pairKey(...teamB);
        const newPartnerA = get(partnerCount, pkA) + 1;
        const newPartnerB = get(partnerCount, pkB) + 1;
        const capExcess = Math.max(0, newPartnerA - partnerCap) ** 2 + Math.max(0, newPartnerB - partnerCap) ** 2;

        const consecPartner = (lastPartnerKeys.has(pkA) ? 1 : 0) + (lastPartnerKeys.has(pkB) ? 1 : 0);
        const mk = matchupKey(teamA, teamB);
        const matchupRepeat = get(matchupCount, mk);
        const partnerCost = newPartnerA ** 2 + newPartnerB ** 2;
        let oppCost = 0;
        for (const a of teamA) for (const b of teamB) oppCost += (get(opponentCount, pairKey(a, b)) + 1) ** 2;

        const score =
          matchupRepeat * 1_000_000_000 +
          capExcess * 200_000_000 +
          consecSit * 40_000_000 +
          consecPartner * 8_000_000 +
          partnerCost * 200_000 +
          oppCost * 50_000 +
          sitSpread * 5_000 +
          consecExcess * 1_000 + // below sitSpread on purpose: equity wins if the two conflict
          maxStreak * 300;

        if (score < bestScore) {
          bestScore = score;
          bestChoices = [{ resting, teamA, teamB, mk, pkA, pkB }];
        } else if (score === bestScore) {
          bestChoices.push({ resting, teamA, teamB, mk, pkA, pkB });
        }
      }
    }

    const best = bestChoices[Math.floor(Math.random() * bestChoices.length)];

    partnerCount[best.pkA] = get(partnerCount, best.pkA) + 1;
    partnerCount[best.pkB] = get(partnerCount, best.pkB) + 1;
    for (const a of best.teamA) {
      for (const b of best.teamB) {
        const k = pairKey(a, b);
        opponentCount[k] = get(opponentCount, k) + 1;
      }
    }
    matchupCount[best.mk] = get(matchupCount, best.mk) + 1;
    for (const id of best.resting) {
      sitCount[id]++;
      consecPlay[id] = 0;
    }
    for (const id of ids) if (!best.resting.includes(id)) consecPlay[id]++;

    lastResting = best.resting;
    lastPartnerKeys = new Set([best.pkA, best.pkB]);

    schedule.push({
      round: r + 1,
      teamA: best.teamA,
      teamB: best.teamB,
      resting: best.resting,
      scoreA: null,
      scoreB: null,
    });
  }

  return schedule;
}

// =============================================================================
// Phase 2 — refinement: time-boxed local-search repair
// =============================================================================

// Every legal replacement for a single round: every possible 4-player subset,
// paired every possible way. Same list is reused to repair every round.
function allRoundOptions(ids) {
  const options = [];
  for (const active of combinations(ids, 4)) {
    const resting = ids.filter((id) => !active.includes(id));
    for (const [teamA, teamB] of pairingsOf(active)) {
      options.push({ teamA, teamB, resting });
    }
  }
  return options;
}

function withRound(schedule, idx, option) {
  const next = schedule.slice();
  next[idx] = { round: schedule[idx].round, teamA: option.teamA, teamB: option.teamB, resting: option.resting, scoreA: null, scoreB: null };
  return next;
}

// One full pass: for every round (in random order), replace it with whichever
// option lowers the schedule's cost the most, if any does. Returns whether
// anything improved. Mutates `state.current`/`state.currentCost` in place and
// updates `state.best`/`state.bestCost` whenever a new low is found.
function greedySweep(state, options, ids, deadline, partnerCap) {
  let improved = false;
  const order = shuffle([...Array(state.current.length).keys()]);

  for (const idx of order) {
    if (Date.now() >= deadline) break;

    let localBest = null;
    let localBestCost = state.currentCost;
    for (const opt of options) {
      const candidate = withRound(state.current, idx, opt);
      const cost = costOf(evaluateSchedule(candidate, ids), partnerCap);
      if (cost < localBestCost) {
        localBestCost = cost;
        localBest = candidate;
      }
    }

    if (localBest) {
      state.current = localBest;
      state.currentCost = localBestCost;
      improved = true;
      if (state.currentCost < state.bestCost) {
        state.best = state.current;
        state.bestCost = state.currentCost;
        if (state.bestCost === 0) return improved;
      }
    }
  }
  return improved;
}

// Iterated local search: alternates pure hill-climbing (`greedySweep`, which
// only ever moves downhill) with short simulated-annealing bursts that accept
// some uphill moves so the search can escape a local optimum a single-round
// greedy sweep can never climb out of. Whichever schedule is best at ANY
// point is tracked separately (`state.best`) and is always what's returned —
// an exploration burst that wanders off can never make the final result
// worse, only potentially better.
function refineSchedule(initial, ids, deadline, partnerCap) {
  const options = allRoundOptions(ids);
  const state = { current: initial, currentCost: costOf(evaluateSchedule(initial, ids), partnerCap), best: initial, bestCost: Infinity };
  state.bestCost = state.currentCost;
  state.best = state.current;

  // Phase 1 — hill-climb straight to the nearest local optimum.
  while (Date.now() < deadline && state.bestCost > 0) {
    if (!greedySweep(state, options, ids, deadline, partnerCap)) break;
  }
  if (state.bestCost === 0) return state.best;

  // Phase 2 — iterated local search: explore, then re-climb, repeat.
  let temperature = Math.max(state.currentCost * 0.02, 50_000);
  const coolingRate = 0.995;
  const BURST_SIZE = 60;

  while (Date.now() < deadline && state.bestCost > 0) {
    // Explorative burst: random single-round moves, Metropolis-accepted (a
    // worse move is taken with probability e^(-delta/temperature), so early,
    // hot iterations explore freely and later, cooler ones barely move).
    for (let i = 0; i < BURST_SIZE && Date.now() < deadline; i++) {
      const idx = Math.floor(Math.random() * state.current.length);
      const opt = options[Math.floor(Math.random() * options.length)];
      const candidate = withRound(state.current, idx, opt);
      const cost = costOf(evaluateSchedule(candidate, ids), partnerCap);
      const delta = cost - state.currentCost;
      if (delta <= 0 || Math.random() < Math.exp(-delta / temperature)) {
        state.current = candidate;
        state.currentCost = cost;
        if (state.currentCost < state.bestCost) {
          state.best = state.current;
          state.bestCost = state.currentCost;
          if (state.bestCost === 0) return state.best;
        }
      }
      temperature *= coolingRate;
    }

    // Exploitative re-climb from wherever the burst landed.
    while (Date.now() < deadline) {
      if (!greedySweep(state, options, ids, deadline, partnerCap)) break;
      if (state.bestCost === 0) return state.best;
    }
  }

  return state.best;
}

// =============================================================================
// Public entry point
// =============================================================================

/**
 * Generate a fair Americano schedule for any player count (>= 4) and any
 * number of rounds, using a construct-then-refine local-search optimiser.
 * Deterministic in structure, random in exploration — every call searches
 * for a fresh schedule, but always converges toward the same fairness bar.
 *
 * @param {string[]} playerIds - 4 or more player ids
 * @param {number} rounds - number of games (each game rests N-4 players)
 * @returns {{ rounds: Array, fairness: object }}
 */
export function generateSchedule(playerIds, rounds = 12) {
  if (playerIds.length < 4) {
    throw new Error('Pick at least 4 players for an Americano.');
  }
  const ids = [...playerIds];

  // Hard cap on how many times any two players may partner: the minimum
  // achievable given the maths (total partnership slots = rounds * 2, spread
  // across every possible pair), rounded up. For 6 players / 12 rounds this
  // is exactly 2 — nobody partners a 3rd time. Enforced as a true constraint
  // (candidates that would exceed it are excluded, not just penalised) in
  // both construction and refinement below.
  const totalPairs = (ids.length * (ids.length - 1)) / 2;
  const partnerCap = Math.max(1, Math.ceil((rounds * 2) / totalPairs));

  // Time budget scales gently with player/round count — harder instances get
  // more search time. A mixer generation may take a couple of seconds; that's
  // an accepted trade for a well-mixed schedule.
  const budgetMs = Math.min(5000, 1200 + ids.length * 150 + rounds * 40);
  const deadline = Date.now() + budgetMs;

  const initial = buildInitialSchedule(ids, rounds, partnerCap);
  const schedule = refineSchedule(initial, ids, deadline, partnerCap);
  const ev = evaluateSchedule(schedule, ids);

  return {
    rounds: schedule,
    fairness: {
      partnerCount: ev.partnerCount,
      opponentCount: ev.opponentCount,
      matchupCount: ev.matchupCount,
      restCount: ev.sitCount,
      playCount: Object.fromEntries(ids.map((id) => [id, rounds - ev.sitCount[id]])),
      maxConsec: ev.maxConsecPlay,
      consecPlayExcess: ev.consecPlayExcess,
      backToBackBench: ev.backToBackSits,
      backToBackPartner: ev.backToBackPartners,
      oppSpread: ev.opponentSpread,
      partnerSpread: ev.partnerSpread,
      duplicateMatchups: ev.duplicateMatchups,
      partnerCap,
    },
  };
}
