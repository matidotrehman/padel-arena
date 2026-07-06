<script>
  import { fly } from 'svelte/transition';
  import { players, ranked, matches } from './lib/stores/store.js';
  import TabBar from './lib/components/TabBar.svelte';
  import LeaderboardTable from './lib/components/LeaderboardTable.svelte';
  import MatchLogger from './lib/components/MatchLogger.svelte';
  import AmericanoMixer from './lib/components/AmericanoMixer.svelte';
  import BadgesPanel from './lib/components/BadgesPanel.svelte';
  import DataSync from './lib/components/DataSync.svelte';
  import PlayersManager from './lib/components/PlayersManager.svelte';
  import StatCard from './lib/components/StatCard.svelte';
  import { initialTheme, applyTheme } from './lib/logic/theme.js';

  let active = $state('leaderboard');
  let theme = $state(initialTheme());

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
  }
  // Keep the <html> class in sync (also covers first mount).
  $effect(() => applyTheme(theme));

  const titles = {
    leaderboard: 'Leaderboard',
    log: 'Log a Match',
    americano: 'Americano Mixer',
    badges: 'Badges',
    manage: 'Manage',
  };

  const totalGames = $derived($matches.length);
  const totalPoints = $derived($players.reduce((n, p) => n + p.pointsWon, 0));
  const leader = $derived($ranked.find((p) => p.matchesPlayed > 0));
</script>

<div class="min-h-dvh max-w-lg mx-auto px-4 pt-5 pb-28">
  <!-- Header -->
  <header class="flex items-center justify-between gap-2 mb-5">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="grid place-items-center w-8 h-8 rounded-xl text-base shrink-0"
              style="background:linear-gradient(160deg,rgba(198,255,50,0.22),rgba(47,240,214,0.12));border:1px solid rgba(198,255,50,0.35);box-shadow:0 0 20px -6px rgba(150,210,0,0.5);">🎾</span>
        <h1 class="h-display font-extrabold text-[21px] leading-none whitespace-nowrap">
          <span class="tx">PADEL</span><span class="gradient-text">ARENA</span>
        </h1>
      </div>
      <p class="text-[10px] tx-faint tracking-[0.2em] uppercase ml-[40px] mt-1 font-semibold truncate">{titles[active]}</p>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      <div class="glass rounded-xl pl-2 pr-2.5 py-1 flex items-center gap-1.5 max-w-[120px]">
        <span class="text-sm shrink-0">👑</span>
        <div class="min-w-0">
          <div class="text-[8px] uppercase tracking-[0.14em] tx-faint font-bold leading-none">Top player</div>
          <div class="h-display font-bold text-[13px] gradient-text truncate leading-tight">{leader ? leader.name : '—'}</div>
        </div>
      </div>
      <button class="glass rounded-xl w-9 h-9 grid place-items-center text-base shrink-0 active:scale-95 transition"
              onclick={toggleTheme} aria-label="Toggle light or dark theme"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  </header>

  <!-- Tab content -->
  {#key active}
    <main in:fly={{ y: 14, duration: 220 }}>
      {#if active === 'leaderboard'}
        <div class="grid grid-cols-3 gap-2.5 mb-4">
          <StatCard label="Games" value={totalGames} icon="🎾" />
          <StatCard label="Points" value={totalPoints} icon="⚡" accent="#22e0c8" />
          <StatCard label="Players" value={$players.length} icon="👥" accent="#f5ff3d" />
        </div>
        <LeaderboardTable />
      {:else if active === 'log'}
        <MatchLogger />
      {:else if active === 'americano'}
        <AmericanoMixer />
      {:else if active === 'badges'}
        <BadgesPanel />
      {:else if active === 'manage'}
        <div class="space-y-6">
          <DataSync />
          <PlayersManager />
        </div>
      {/if}
    </main>
  {/key}
</div>

<TabBar bind:active />
