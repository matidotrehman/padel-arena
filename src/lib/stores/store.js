import { writable, derived, get } from 'svelte/store';
import {
  loadState,
  saveState,
  defaultState,
  makePlayer,
  makeId,
  NEON_PALETTE,
} from '../logic/persistence.js';
import { rankedPlayers } from '../logic/stats.js';

// ---- Core writable store, hydrated from LocalStorage ----
export const store = writable(loadState());

// Persist on every change (the "database" write).
store.subscribe((state) => saveState(state));

// ---- Derived views ----
export const players = derived(store, ($s) => $s.players);
export const ranked = derived(store, ($s) => rankedPlayers($s.players));
export const matches = derived(store, ($s) => $s.matches);

// ---- Helpers ----
function update(fn) {
  store.update((s) => {
    const next = fn(structuredClone(s));
    next.lastUpdated = Date.now();
    return next;
  });
}

function applyResult(player, isWin, scored, conceded, choked = false) {
  player.matchesPlayed += 1;
  player.pointsWon += scored;
  player.pointsConceded += conceded;
  if (isWin) player.wins += 1;
  else player.losses += 1;
  if (choked) player.chokes += 1;
  player.results.push(isWin ? 'W' : 'L');
}

// ---- Player management ----
export function addPlayer(name) {
  const clean = name.trim();
  if (!clean) return;
  update((s) => {
    s.players.push(makePlayer(clean, s.players.length));
    return s;
  });
}

export function renamePlayer(id, name) {
  const clean = name.trim();
  if (!clean) return;
  update((s) => {
    const p = s.players.find((x) => x.id === id);
    if (p) p.name = clean;
    return s;
  });
}

export function removePlayer(id) {
  update((s) => {
    s.players = s.players.filter((p) => p.id !== id);
    return s;
  });
}

export function setPlayerColor(id, color) {
  update((s) => {
    const p = s.players.find((x) => x.id === id);
    if (p) p.avatarColor = color;
    return s;
  });
}

// ---- Fixed Partners mode: 2v2 with set scores ----
// teamA / teamB: arrays of 2 player ids. sets: [{a, b}, ...]
export function logFixedMatch({ teamA, teamB, sets }) {
  const scoreA = sets.reduce((n, s) => n + (+s.a || 0), 0);
  const scoreB = sets.reduce((n, s) => n + (+s.b || 0), 0);
  const setsA = sets.filter((s) => +s.a > +s.b).length;
  const setsB = sets.filter((s) => +s.b > +s.a).length;
  const aWins = setsA === setsB ? scoreA > scoreB : setsA > setsB;

  // "Choke": a team lost the match after winning the first set clearly.
  const firstSet = sets[0] || { a: 0, b: 0 };
  const aChoked = !aWins && +firstSet.a - +firstSet.b >= 3;
  const bChoked = aWins && +firstSet.b - +firstSet.a >= 3;

  update((s) => {
    for (const id of teamA) {
      const p = s.players.find((x) => x.id === id);
      if (p) applyResult(p, aWins, scoreA, scoreB, aChoked);
    }
    for (const id of teamB) {
      const p = s.players.find((x) => x.id === id);
      if (p) applyResult(p, !aWins, scoreB, scoreA, bChoked);
    }
    s.matches.push({
      id: makeId('m'),
      date: Date.now(),
      mode: 'fixed',
      teamA,
      teamB,
      scoreA,
      scoreB,
      sets,
    });
    return s;
  });
}

// ---- Individual mode: credit points per player, mark winners ----
// entries: [{ id, points }]. winnerIds: array of ids that "won" the match.
export function logIndividualMatch({ entries, winnerIds }) {
  const totalPts = entries.reduce((n, e) => n + (+e.points || 0), 0);
  update((s) => {
    for (const e of entries) {
      const p = s.players.find((x) => x.id === e.id);
      if (!p) continue;
      const scored = +e.points || 0;
      applyResult(p, winnerIds.includes(e.id), scored, totalPts - scored, false);
    }
    s.matches.push({
      id: makeId('m'),
      date: Date.now(),
      mode: 'individual',
      entries,
      winnerIds,
    });
    return s;
  });
}

// ---- Merge a finished Americano session into lifetime stats ----
// Points/conceded come from the aggregate totals; wins/losses and the ordered
// W/L history are replayed game-by-game from the rounds so form & streaks stay
// accurate.
export function mergeAmericano(totals, rounds) {
  update((s) => {
    // Points + matches played from aggregate totals.
    for (const [id, t] of Object.entries(totals)) {
      const p = s.players.find((x) => x.id === id);
      if (!p || t.games === 0) continue;
      p.matchesPlayed += t.games;
      p.pointsWon += t.points;
      p.pointsConceded += t.conceded;
    }
    // Ordered per-game results → wins, losses, streak history.
    for (const g of rounds) {
      if (g.scoreA == null || g.scoreB == null) continue;
      const a = +g.scoreA;
      const b = +g.scoreB;
      if (a === b) continue; // draws don't count as W or L
      const aWon = a > b;
      for (const id of g.teamA) {
        const p = s.players.find((x) => x.id === id);
        if (!p) continue;
        aWon ? p.wins++ : p.losses++;
        p.results.push(aWon ? 'W' : 'L');
      }
      for (const id of g.teamB) {
        const p = s.players.find((x) => x.id === id);
        if (!p) continue;
        aWon ? p.losses++ : p.wins++;
        p.results.push(aWon ? 'L' : 'W');
      }
    }
    s.matches.push({
      id: makeId('m'),
      date: Date.now(),
      mode: 'americano',
      rounds,
    });
    return s;
  });
}

// ---- Bulk replace (import) / reset ----
export function replaceState(newState) {
  store.set({ ...newState, lastUpdated: Date.now() });
}

export function resetAll() {
  store.set(defaultState());
}

export function currentState() {
  return get(store);
}

export { NEON_PALETTE };
