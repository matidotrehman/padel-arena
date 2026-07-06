<script>
  import { fly } from 'svelte/transition';
  import { players } from '../stores/store.js';
  import { computeBadges } from '../logic/badges.js';
  import BadgeCard from './BadgeCard.svelte';

  const badges = $derived(computeBadges($players));
</script>

<div class="space-y-3">
  <div class="card">
    <h3 class="font-display font-bold neon-text">Weekly Honours</h3>
    <p class="text-sm text-white/55">Auto-awarded from the group's stats. Tap a card to see the rule.</p>
  </div>
  <div class="grid grid-cols-2 gap-3">
    {#each badges as badge, i}
      <div in:fly={{ y: 16, delay: i * 60, duration: 260 }}>
        <BadgeCard {badge} />
      </div>
    {/each}
  </div>
</div>
