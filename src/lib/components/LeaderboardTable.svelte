<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { ranked } from '../stores/store.js';
  import PlayerRow from './PlayerRow.svelte';

  const hasGames = $derived($ranked.some((p) => p.matchesPlayed > 0));
</script>

<div class="space-y-2.5">
  {#if !hasGames}
    <div class="card text-center py-8 text-white/50" in:fade>
      <div class="text-4xl mb-2">🎾</div>
      <p class="font-semibold text-white/70">No matches yet</p>
      <p class="text-sm">Log a game or run an Americano to light up the board.</p>
    </div>
  {/if}

  {#each $ranked as player, i (player.id)}
    <div animate:flip={{ duration: 450 }}>
      <PlayerRow {player} rank={i + 1} />
    </div>
  {/each}
</div>
