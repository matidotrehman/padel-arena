<script>
  import { fly, fade, scale } from 'svelte/transition';
  import { players } from './lib/stores/store.js';
  import { filteredMatches, rangeStats, rangeRanked } from './lib/stores/analytics.js';
  import TabBar from './lib/components/TabBar.svelte';
  import DateRangeBar from './lib/components/DateRangeBar.svelte';
  import LeaderboardTable from './lib/components/LeaderboardTable.svelte';
  import MatchLogger from './lib/components/MatchLogger.svelte';
  import AmericanoMixer from './lib/components/AmericanoMixer.svelte';
  import BadgesPanel from './lib/components/BadgesPanel.svelte';
  import AnalyticsHub from './lib/components/AnalyticsHub.svelte';
  import MatchHistory from './lib/components/MatchHistory.svelte';
  import DataSync from './lib/components/DataSync.svelte';
  import PlayersManager from './lib/components/PlayersManager.svelte';
  import StatCard from './lib/components/StatCard.svelte';
  import { initialTheme, applyTheme } from './lib/logic/theme.js';
  import { startSync } from './lib/logic/sync.js';
  import { Trophy, Sun, Moon, Activity, Zap, Users } from '@lucide/svelte';

  startSync(); // begin sharing state with the group (fails soft to local-only)

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
    chemistry: 'Analytics & Chem',
    history: 'Match History',
    manage: 'Manage',
  };

  // Tabs whose data is scoped by the sticky date-range filter.
  const DATE_SCOPED_TABS = new Set(['leaderboard', 'badges', 'chemistry']);
  const showDateBar = $derived(DATE_SCOPED_TABS.has(active));

  const totalGames = $derived($filteredMatches.length);
  const totalPoints = $derived($rangeStats.reduce((n, p) => n + p.pointsWon, 0));
  const leader = $derived($rangeRanked.find((p) => p.matchesPlayed > 0));
</script>

<div class="h-dvh flex flex-col max-w-lg mx-auto overflow-hidden">
  <!-- Header: pinned, never scrolls away -->
  <header class="shrink-0 z-20 flex items-center justify-between gap-2 px-4"
           style="padding-top:max(1.25rem, env(safe-area-inset-top)); padding-bottom:0.75rem; background:var(--page-solid);">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="grid place-items-center w-8 h-8 rounded-[var(--radius-sm)] shrink-0"
              style="background:var(--surface-1);border:1px solid var(--border);color:var(--accent-fg);">
          <Trophy size={16} strokeWidth={2.25} />
        </span>
        <h1 class="h-display font-extrabold text-[19px] leading-none whitespace-nowrap tracking-tight">
          <span class="tx">Padel</span><span style="color:var(--accent-fg);">6</span>
        </h1>
      </div>
      <p class="text-[10px] tx-faint tracking-[0.2em] uppercase ml-[40px] mt-1 font-semibold truncate">{titles[active]}</p>
    </div>
    <div class="flex items-center gap-1 shrink-0 rounded-[var(--radius-sm)] pl-2.5 pr-1 py-1"
         style="background:var(--surface-1);border:1px solid var(--border);">
      <div class="min-w-0 max-w-[96px]">
        <div class="text-[8px] uppercase tracking-[0.14em] tx-faint font-bold leading-none">Top</div>
        <div class="h-display font-bold text-[12px] tx truncate leading-tight">{leader ? leader.name : '—'}</div>
      </div>
      <span class="w-px h-6 shrink-0" style="background:var(--border);"></span>
      <button class="theme-toggle relative w-7 h-7 grid place-items-center rounded-[var(--radius-sm)] tx-muted shrink-0 active:scale-90"
              onclick={toggleTheme} aria-label="Toggle light or dark theme"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
        {#if theme === 'dark'}
          <span class="grid place-items-center absolute inset-0" in:scale={{ duration: 150, start: 0.5 }} out:fade={{ duration: 100 }}>
            <Sun size={14} strokeWidth={2.25} />
          </span>
        {:else}
          <span class="grid place-items-center absolute inset-0" in:scale={{ duration: 150, start: 0.5 }} out:fade={{ duration: 100 }}>
            <Moon size={14} strokeWidth={2.25} />
          </span>
        {/if}
      </button>
    </div>
  </header>

  <!-- Scrollable body: everything else lives here, independent of the pinned header/nav -->
  <div class="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-24">
    {#if showDateBar}
      <DateRangeBar />
    {/if}

    {#key active}
      <main class="tab-panel" data-tab={active} in:fly={{ y: 14, duration: 220 }}>
        {#if active === 'leaderboard'}
          <div class="grid grid-cols-3 gap-2 mb-4">
            <StatCard label="Games" value={totalGames} icon={Activity} />
            <StatCard label="Points" value={totalPoints} icon={Zap} />
            <StatCard label="Players" value={$players.length} icon={Users} />
          </div>
          <LeaderboardTable />
        {:else if active === 'log'}
          <MatchLogger />
        {:else if active === 'americano'}
          <AmericanoMixer />
        {:else if active === 'badges'}
          <BadgesPanel />
        {:else if active === 'chemistry'}
          <AnalyticsHub />
        {:else if active === 'history'}
          <MatchHistory />
        {:else if active === 'manage'}
          <div class="space-y-6">
            <DataSync />
            <PlayersManager />
          </div>
        {/if}
      </main>
    {/key}
  </div>
</div>

<TabBar bind:active />

<style>
  .theme-toggle {
    transition: background-color 150ms var(--ease-out-smooth), transform 150ms var(--ease-spring);
  }
  @media (hover: hover) {
    .theme-toggle:hover {
      background: var(--overlay-2);
    }
  }

  /* Layer a subtle spring scale-in on top of the fly transition. `scale` is
     an independent CSS property from `transform`, so it composes with the
     translate that svelte/transition:fly drives via inline style instead of
     fighting it. */
  .tab-panel {
    animation: tab-pop-in 260ms var(--ease-spring);
  }
  @keyframes tab-pop-in {
    from {
      scale: 0.98;
    }
    to {
      scale: 1;
    }
  }
</style>
