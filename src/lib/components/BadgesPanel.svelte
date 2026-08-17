<script>
  import { fly } from 'svelte/transition';
  import { rangeStats, filteredMatches } from '../stores/analytics.js';
  import { players } from '../stores/store.js';
  import { rankMode } from '../stores/prefs.js';
  import { computeBadges, computeTierBadge, computeTierPool } from '../logic/badges.js';
  import { fifaRating } from '../logic/stats.js';
  import BadgeCard from './BadgeCard.svelte';
  import Avatar from './Avatar.svelte';
  import AchievementsPanel from './AchievementsPanel.svelte';

  const badges = $derived(computeBadges($rangeStats, $filteredMatches, $rankMode));
  const tierPool = $derived(computeTierPool($players));
  const tiers = $derived(
    $rangeStats
      .map((p) => ({ player: p, tier: computeTierBadge(p, tierPool) }))
      .filter((row) => row.tier)
      .sort((a, b) => fifaRating(b.player) - fifaRating(a.player))
  );
</script>

<div class="space-y-3">
  <div class="card">
    <h3 class="font-display font-bold neon-text">Weekly Honours</h3>
    <p class="text-sm tx-muted">Auto-awarded from the group's stats for the selected timeframe.</p>
  </div>
  <div class="grid grid-cols-2 gap-3 items-stretch">
    {#each badges as badge, i}
      <div class={i === 0 ? 'col-span-2' : ''} in:fly={{ y: 16, delay: i * 60, duration: 260 }}>
        <BadgeCard {badge} hero={i === 0} />
      </div>
    {/each}
  </div>

  {#if tiers.length}
    <div class="card space-y-1">
      <h3 class="font-display font-bold neon-text">Performance Tiers</h3>
      <p class="text-sm tx-muted">Every player's own tier, judged on their rating — not the group.</p>
    </div>
    <div class="space-y-1.5">
      {#each tiers as row, i (row.player.id)}
        {@const TierIcon = row.tier.icon}
        <div
          class="tier-row glass rounded-[var(--radius-md)] px-3 py-2 flex items-center gap-2.5"
          in:fly={{ y: 10, duration: 200, delay: i * 40 }}
        >
          <Avatar player={row.player} size={30} />
          <span class="flex-1 truncate text-sm font-medium tx">{row.player.name}</span>
          <span class="chip !px-2 !py-1 items-center gap-1" style="background:{row.tier.accent}22;color:{row.tier.accent};">
            <TierIcon size={12} strokeWidth={2.25} />
            {row.tier.title}
          </span>
          <span class="mono text-xs tx-faint w-8 text-right">{row.tier.value}</span>
        </div>
      {/each}
    </div>
  {/if}

  <AchievementsPanel />
</div>

<style>
  .tier-row {
    transition: background-color 180ms var(--ease-out-smooth), transform 180ms var(--ease-spring);
  }
  .tier-row:hover {
    background: var(--overlay-1);
  }
  .tier-row:active {
    transform: scale(0.99);
  }
</style>
