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

  let active = $state('leaderboard');

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
  <header class="flex items-center justify-between mb-5">
    <div>
      <div class="flex items-center gap-2">
        <span class="text-2xl">🎾</span>
        <h1 class="font-display font-extrabold text-2xl tracking-tight">
          PADEL<span class="neon-text">ARENA</span>
        </h1>
      </div>
      <p class="text-xs text-white/40 tracking-widest uppercase ml-9 -mt-1">{titles[active]}</p>
    </div>
    <div class="text-right">
      <div class="text-[10px] uppercase tracking-widest text-white/35">Top dog</div>
      <div class="font-display font-bold text-sm neon-text">{leader ? leader.name : '—'}</div>
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
