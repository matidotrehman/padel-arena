// LocalStorage persistence + export/import. Zero backend — the browser IS the database.

export const STORAGE_KEY = 'padel_stats';
export const SCHEMA_VERSION = 1;

const NEON_PALETTE = [
  '#b6ff2e', // lime
  '#22e0c8', // cyan
  '#f5ff3d', // yellow
  '#ff5e3a', // hot orange
  '#56c8ff', // ice blue
  '#c77dff', // violet
  '#ff8fab', // pink
  '#7dffb0', // mint
];

const SEED_NAMES = ['Ahmed', 'Mati', 'Hamza', 'Tayyab', 'Ali', 'Jan'];

let idCounter = 0;
export function makeId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function makePlayer(name, colorIndex = 0) {
  return {
    id: makeId('p'),
    name,
    avatarColor: NEON_PALETTE[colorIndex % NEON_PALETTE.length],
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    pointsWon: 0,
    pointsConceded: 0,
    chokes: 0, // matches lost after leading significantly
    results: [], // ordered "W" / "L" history — drives form & streaks
  };
}

export function defaultState() {
  return {
    version: SCHEMA_VERSION,
    lastUpdated: Date.now(),
    players: SEED_NAMES.map((n, i) => makePlayer(n, i)),
    matches: [],
    deletedMatchIds: [],
    deletedPlayerIds: [],
  };
}

// Merge persisted data over a fresh default so new fields are never undefined.
function reconcile(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const players = Array.isArray(raw.players)
    ? raw.players.map((p, i) => ({ ...makePlayer(p.name ?? `Player ${i + 1}`, i), ...p }))
    : base.players;
  return {
    version: SCHEMA_VERSION,
    lastUpdated: raw.lastUpdated ?? Date.now(),
    players,
    matches: Array.isArray(raw.matches) ? raw.matches : [],
    deletedMatchIds: Array.isArray(raw.deletedMatchIds) ? raw.deletedMatchIds : [],
    deletedPlayerIds: Array.isArray(raw.deletedPlayerIds) ? raw.deletedPlayerIds : [],
  };
}

export function loadState() {
  if (typeof localStorage === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return reconcile(JSON.parse(raw));
  } catch (e) {
    console.warn('Failed to load state, using defaults.', e);
    return defaultState();
  }
}

export function saveState(state) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state.', e);
  }
}

// ---- Export / Import ----
export function exportState(state) {
  const payload = JSON.stringify({ ...state, exportedAt: Date.now() }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'padel_stats.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseImport(text) {
  const data = JSON.parse(text);
  return reconcile(data);
}

export { NEON_PALETTE };
