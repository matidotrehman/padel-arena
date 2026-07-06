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
    <p class="text-sm tx-muted">Auto-awarded from the group's stats — updated after every match.</p>
  </div>
  <div class="grid grid-cols-2 gap-3 items-stretch">
    {#each badges as badge, i}
      <div class="h-full" in:fly={{ y: 16, delay: i * 60, duration: 260 }}>
        <BadgeCard {badge} />
      </div>
    {/each}
  </div>
</div>
