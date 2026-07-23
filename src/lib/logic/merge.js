// Pure state merge for shared multiplayer sync.
//
// Matches and players are unioned by id, with tombstones (deletedMatchIds /
// deletedPlayerIds) so a delete on one device isn't resurrected by another.
// This means two people logging different matches at the same time can never
// overwrite each other — both survive the merge.
//
// NOTE: this file is imported by BOTH the client (src) and the Netlify
// function (netlify/functions/state.mjs). Keep it dependency-free and pure.
//
// Player *stats* in the merged result may be stale — callers recompute them
// from the merged `matches` (the source of truth) after merging.

const uniq = (arr) => [...new Set(arr)];

export function mergeStates(a, b) {
  if (!a) return b || null;
  if (!b) return a;

  const delMatches = uniq([...(a.deletedMatchIds || []), ...(b.deletedMatchIds || [])]);

  // Union players by id; the more-recently-updated state wins name/colour.
  const aNewer = (a.lastUpdated || 0) >= (b.lastUpdated || 0);
  const older = aNewer ? b : a;
  const newer = aNewer ? a : b;

  // Tombstones normally union forever (a delete on one device must never be
  // resurrected by another). But an explicit re-add is also a real user
  // action, so if the more-recently-updated side re-added a player — it's in
  // their players list and NOT in their own deletedPlayerIds — that re-add
  // wins over a stale tombstone still sitting on the older side.
  const newerPlayerIds = new Set((newer.players || []).map((p) => p.id));
  const newerDeleted = new Set(newer.deletedPlayerIds || []);
  const delPlayers = uniq([...(a.deletedPlayerIds || []), ...(b.deletedPlayerIds || [])]).filter(
    (id) => !(newerPlayerIds.has(id) && !newerDeleted.has(id))
  );

  // Union matches by id, drop tombstoned ones, keep chronological order.
  const matchMap = new Map();
  for (const m of [...(a.matches || []), ...(b.matches || [])]) {
    if (m && m.id && !delMatches.includes(m.id)) matchMap.set(m.id, m);
  }
  const matches = [...matchMap.values()].sort((x, y) => (x.date || 0) - (y.date || 0));

  const playerMap = new Map();
  for (const p of older.players || []) playerMap.set(p.id, p);
  for (const p of newer.players || []) playerMap.set(p.id, p);
  const players = [...playerMap.values()].filter((p) => !delPlayers.includes(p.id));

  return {
    version: 1,
    players,
    matches,
    deletedMatchIds: delMatches,
    deletedPlayerIds: delPlayers,
    lastUpdated: Math.max(a.lastUpdated || 0, b.lastUpdated || 0),
  };
}
