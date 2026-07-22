<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { rangeRanked, rangeStats, filteredMatches } from '../stores/analytics.js';
  import { rankMode } from '../stores/prefs.js';
  import { computeBadges } from '../logic/badges.js';
  import PlayerRow from './PlayerRow.svelte';
  import PlayerDetail from './PlayerDetail.svelte';

  const hasGames = $derived($rangeRanked.some((p) => p.matchesPlayed > 0));
  const badges = $derived(computeBadges($rangeStats, $filteredMatches, $rankMode));
  let selected = $state(null);
</script>

<div class="space-y-2.5">
  <!-- Ranking mode switch -->
  <div class="glass rounded-2xl p-1 grid grid-cols-2 gap-1">
    <button
      class="btn !py-2 text-sm {$rankMode === 'points' ? 'btn-primary' : 'tx-muted'}"
      onclick={() => rankMode.set('points')}>⚡ Points</button>
    <button
      class="btn !py-2 text-sm {$rankMode === 'winrate' ? 'btn-primary' : 'tx-muted'}"
      onclick={() => rankMode.set('winrate')}>📊 Win %</button>
  </div>

  {#if !hasGames}
    <div class="card text-center py-8 tx-muted" in:fade>
      <div class="text-4xl mb-2">🎾</div>
      <p class="font-semibold tx">No matches in this timeframe</p>
      <p class="text-sm">Try a different date range, or log a game / run an Americano.</p>
    </div>
  {:else}
    <p class="text-[11px] tx-faint text-center">Tap a player for their head-to-head record</p>
  {/if}

  {#each $rangeRanked as player, i (player.id)}
    <div animate:flip={{ duration: 450 }}>
      <PlayerRow {player} rank={i + 1} mode={$rankMode} {badges} onselect={(p) => (selected = p)} />
    </div>
  {/each}
</div>

{#if selected}
  <PlayerDetail player={selected} players={$rangeRanked} matches={$filteredMatches} onclose={() => (selected = null)} />
{/if}
