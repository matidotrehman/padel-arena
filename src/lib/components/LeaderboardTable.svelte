<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { rangeRanked, rangeStats, filteredMatches } from '../stores/analytics.js';
  import { players } from '../stores/store.js';
  import { rankMode } from '../stores/prefs.js';
  import { computeBadges, computeTierPool } from '../logic/badges.js';
  import PlayerRow from './PlayerRow.svelte';
  import PlayerDetail from './PlayerDetail.svelte';

  const hasGames = $derived($rangeRanked.some((p) => p.matchesPlayed > 0));
  const badges = $derived(computeBadges($rangeStats, $filteredMatches, $rankMode));
  const tierPool = $derived(computeTierPool($players));
  let selected = $state(null);
</script>

<div class="space-y-2.5">
  <!-- Ranking mode switch -->
  <div class="flex items-center justify-end gap-2 px-0.5">
    <span class="text-[10px] uppercase tracking-[0.12em] tx-faint font-bold">Rank by</span>
    <div class="relative inline-flex rounded-md p-0.5" style="background:var(--surface-1);border:1px solid var(--border);">
      <div class="absolute top-0.5 bottom-0.5 rounded transition-transform duration-200 ease-out"
           style="width:calc(50% - 2px);
                  left:2px;
                  transform:translateX({$rankMode === 'winrate' ? '100%' : '0'});
                  background:var(--accent-bright);"></div>
      <button
        class="relative z-10 px-3 py-1 text-[11px] font-semibold rounded transition-colors {$rankMode === 'points' ? 'text-white' : 'tx-muted'}"
        onclick={() => rankMode.set('points')}>Points</button>
      <button
        class="relative z-10 px-3 py-1 text-[11px] font-semibold rounded transition-colors {$rankMode === 'winrate' ? 'text-white' : 'tx-muted'}"
        onclick={() => rankMode.set('winrate')}>Win %</button>
    </div>
  </div>

  {#if !hasGames}
    <div class="rounded-lg text-center py-8 tx-muted" style="background:var(--surface-1);border:1px solid var(--border);" in:fade>
      <p class="font-semibold tx">No matches in this timeframe</p>
      <p class="text-sm">Try a different date range, or log a game / run an Americano.</p>
    </div>
  {:else}
    <p class="text-[11px] tx-faint text-center">Tap a player for their head-to-head record</p>
  {/if}

  {#each $rangeRanked as player, i (player.id)}
    <div animate:flip={{ duration: 450 }}>
      <PlayerRow {player} rank={i + 1} mode={$rankMode} {badges} {tierPool} onselect={(p) => (selected = p)} />
    </div>
  {/each}
</div>

{#if selected}
  <PlayerDetail player={selected} players={$rangeRanked} matches={$filteredMatches} onclose={() => (selected = null)} />
{/if}
