<script>
  import { rangeRanked, rangeStats, filteredMatches } from '../stores/analytics.js';
  import { rankMode } from '../stores/prefs.js';
  import { computeBadges } from '../logic/badges.js';
  import FifaPlayerCard from './FifaPlayerCard.svelte';

  let { onselect } = $props();
  const badges = $derived(computeBadges($rangeStats, $filteredMatches, $rankMode));
</script>

<div class="grid grid-cols-2 gap-2.5">
  {#each $rangeRanked as player (player.id)}
    <FifaPlayerCard {player} {badges} mode={$rankMode} {onselect} />
  {/each}
</div>
