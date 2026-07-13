import { writable, derived, get } from 'svelte/store';
import {
  loadState,
  saveState,
  defaultState,
  makePlayer,
  makeId,
  playerId,
  migrateState,
  NEON_PALETTE,
} from '../logic/persistence.js';
import { rankedPlayers } from '../logic/stats.js';
import { sessionTotals } from '../logic/americano.js';
import { mergeStates } from '../logic/merge.js';
import { rankMode } from './prefs.js';

// ---- Core writable store, hydrated from LocalStorage ----
// Recompute once on load: migration may have deduped players, so their stats
// must be rebuilt from the (remapped) matches.
const initialState = loadState();
recompute(initialState);
export const store = writable(initialState);

// Persist on every change (the "database" write).
store.subscribe((state) => saveState(state));

// ---- Derived views ----
export const players = derived(store, ($s) => $s.players);
export const ranked = derived([store, rankMode], ([$s, $m]) => rankedPlayers($s.players, $m));
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

// Derive fixed-match outcome from its stored set scores.
export function fixedOutcome(match) {
  const sets = match.sets || [];
  const scoreA = sets.reduce((n, s) => n + (+s.a || 0), 0);
  const scoreB = sets.reduce((n, s) => n + (+s.b || 0), 0);
  const setsA = sets.filter((s) => +s.a > +s.b).length;
  const setsB = sets.filter((s) => +s.b > +s.a).length;
  const aWins = setsA === setsB ? scoreA > scoreB : setsA > setsB;
  const fs = sets[0] || { a: 0, b: 0 };
  const aChoked = !aWins && +fs.a - +fs.b >= 3;
  const bChoked = aWins && +fs.b - +fs.a >= 3;
  return { scoreA, scoreB, aWins, aChoked, bChoked };
}

// Apply one stored match record onto a { id -> player } map. This is the
// single source of truth for stats, used both when logging and when
// recomputing after a deletion — so they can never drift apart.
function applyMatch(byId, m) {
  if (m.mode === 'fixed') {
    const { scoreA, scoreB, aWins, aChoked, bChoked } = fixedOutcome(m);
    for (const id of m.teamA || []) if (byId[id]) applyResult(byId[id], aWins, scoreA, scoreB, aChoked);
    for (const id of m.teamB || []) if (byId[id]) applyResult(byId[id], !aWins, scoreB, scoreA, bChoked);
  } else if (m.mode === 'individual') {
    const total = (m.entries || []).reduce((n, e) => n + (+e.points || 0), 0);
    for (const e of m.entries || []) {
      const p = byId[e.id];
      if (!p) continue;
      const scored = +e.points || 0;
      applyResult(p, (m.winnerIds || []).includes(e.id), scored, total - scored, false);
    }
  } else if (m.mode === 'americano') {
    const rounds = m.rounds || [];
    const ids = [...new Set(rounds.flatMap((r) => [...(r.teamA || []), ...(r.teamB || [])]))];
    const totals = sessionTotals(rounds, ids);
    for (const [id, t] of Object.entries(totals)) {
      const p = byId[id];
      if (!p || t.games === 0) continue;
      p.matchesPlayed += t.games;
      p.pointsWon += t.points;
      p.pointsConceded += t.conceded;
    }
    for (const g of rounds) {
      if (g.scoreA == null || g.scoreB == null) continue;
      const a = +g.scoreA;
      const b = +g.scoreB;
      if (a === b) continue;
      const aWon = a > b;
      for (const id of g.teamA) {
        const p = byId[id];
        if (!p) continue;
        aWon ? p.wins++ : p.losses++;
        p.results.push(aWon ? 'W' : 'L');
      }
      for (const id of g.teamB) {
        const p = byId[id];
        if (!p) continue;
        aWon ? p.losses++ : p.wins++;
        p.results.push(aWon ? 'L' : 'W');
      }
    }
  }
}

// Rebuild every player's stats from scratch by replaying all matches in order.
function recompute(s) {
  for (const p of s.players) {
    p.matchesPlayed = 0;
    p.wins = 0;
    p.losses = 0;
    p.pointsWon = 0;
    p.pointsConceded = 0;
    p.chokes = 0;
    p.results = [];
  }
  const byId = Object.fromEntries(s.players.map((p) => [p.id, p]));
  const ordered = [...s.matches].sort((a, b) => (a.date || 0) - (b.date || 0));
  for (const m of ordered) applyMatch(byId, m);
}

// ---- Player management ----
export function addPlayer(name) {
  const clean = name.trim();
  if (!clean) return;
  update((s) => {
    const id = playerId(clean);
    s.deletedPlayerIds = (s.deletedPlayerIds || []).filter((x) => x !== id); // un-tombstone on re-add
    if (!s.players.some((p) => p.id === id)) s.players.push(makePlayer(clean, s.players.length));
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
    s.deletedPlayerIds = [...new Set([...(s.deletedPlayerIds || []), id])]; // tombstone for sync
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
  update((s) => {
    const { scoreA, scoreB } = fixedOutcome({ sets });
    const match = { id: makeId('m'), date: Date.now(), mode: 'fixed', teamA, teamB, scoreA, scoreB, sets };
    s.matches.push(match);
    applyMatch(Object.fromEntries(s.players.map((p) => [p.id, p])), match);
    return s;
  });
}

// ---- Individual mode: credit points per player, mark winners ----
// entries: [{ id, points }]. winnerIds: array of ids that "won" the match.
export function logIndividualMatch({ entries, winnerIds }) {
  update((s) => {
    const match = { id: makeId('m'), date: Date.now(), mode: 'individual', entries, winnerIds };
    s.matches.push(match);
    applyMatch(Object.fromEntries(s.players.map((p) => [p.id, p])), match);
    return s;
  });
}

// ---- Merge a finished Americano session into lifetime stats ----
export function mergeAmericano(rounds) {
  update((s) => {
    const match = { id: makeId('m'), date: Date.now(), mode: 'americano', rounds };
    s.matches.push(match);
    applyMatch(Object.fromEntries(s.players.map((p) => [p.id, p])), match);
    return s;
  });
}

// ---- Delete a logged match and recompute everyone's stats from the rest ----
export function deleteMatch(id) {
  update((s) => {
    s.matches = s.matches.filter((m) => m.id !== id);
    s.deletedMatchIds = [...new Set([...(s.deletedMatchIds || []), id])]; // tombstone for sync
    recompute(s);
    return s;
  });
}

// ---- Merge a remote (shared) state into local, recompute, adopt ----
// Used by the sync layer. Preserves the merged lastUpdated (no fresh stamp) so
// it doesn't look artificially "newest". Returns the merged state, or the
// current state unchanged when nothing meaningful differs.
function sig(s) {
  return [
    s.lastUpdated,
    (s.matches || []).length,
    (s.deletedMatchIds || []).length,
    (s.deletedPlayerIds || []).length,
    (s.players || []).map((p) => p.id + p.name + p.avatarColor).join(','),
  ].join('|');
}

// Returns true if local state changed (so the sync layer can push the result).
export function applyMerged(remoteState) {
  if (!remoteState) return false;
  const cur = get(store);
  let merged = mergeStates(cur, remoteState);
  if (!merged) return false;
  merged = migrateState(merged); // dedupe + tombstone any legacy ids pulled in
  if (sig(merged) === sig(cur)) return false;
  recompute(merged);
  store.set(merged); // keep merged.lastUpdated; do NOT bump
  return true;
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
