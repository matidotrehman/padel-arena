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
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center w-9 h-9 rounded-2xl text-lg shrink-0"
              style="background:linear-gradient(160deg,rgba(198,255,50,0.22),rgba(47,240,214,0.12));border:1px solid rgba(198,255,50,0.3);box-shadow:0 0 20px -6px rgba(198,255,50,0.5);">🎾</span>
        <h1 class="h-display font-extrabold text-[26px] leading-none">
          <span class="text-white">PADEL</span><span class="gradient-text">ARENA</span>
        </h1>
      </div>
      <p class="text-[11px] text-white/40 tracking-[0.2em] uppercase ml-[46px] mt-1 font-semibold">{titles[active]}</p>
    </div>
    <div class="text-right glass rounded-2xl px-3 py-1.5">
      <div class="text-[9px] uppercase tracking-[0.18em] text-white/35 font-bold">👑 Top dog</div>
      <div class="h-display font-bold text-sm gradient-text">{leader ? leader.name : '—'}</div>
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
