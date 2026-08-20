// Shared bottom-nav / sidebar item list — one source of truth for the
// mobile TabBar and the desktop Sidebar so they can't drift apart.
import { LayoutGrid, Shuffle, Award, Clock, Database } from '@lucide/svelte';

export const NAV_TABS = [
  { id: 'leaderboard', icon: LayoutGrid, label: 'Board' },
  { id: 'americano', icon: Shuffle, label: 'Mixer' },
  { id: 'stats', icon: Award, label: 'Stats' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'manage', icon: Database, label: 'Data' },
];
