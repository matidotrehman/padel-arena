<script>
  import { fly } from 'svelte/transition';
  import { rangeStats, filteredMatches } from '../stores/analytics.js';
  import { rankMode } from '../stores/prefs.js';
  import { computeBadges, computeTierBadge } from '../logic/badges.js';
  import { fifaRating } from '../logic/stats.js';
  import BadgeCard from './BadgeCard.svelte';
  import Avatar from './Avatar.svelte';

  const badges = $derived(computeBadges($rangeStats, $filteredMatches, $rankMode));
  const tiers = $derived(
    $rangeStats
      .map((p) => ({ player: p, tier: computeTierBadge(p) }))
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
      <div class="h-full" in:fly={{ y: 16, delay: i * 60, duration: 260 }}>
        <BadgeCard {badge} />
      </div>
    {/each}
  </div>

  {#if tiers.length}
    <div class="card space-y-1">
      <h3 class="font-display font-bold neon-text">Performance Tiers</h3>
      <p class="text-sm tx-muted">Every player's own tier, judged on their rating — not the group.</p>
    </div>
    <div class="space-y-1.5">
      {#each tiers as row (row.player.id)}
        <div class="glass rounded-xl px-3 py-2 flex items-center gap-2.5">
          <Avatar player={row.player} size={30} />
          <span class="flex-1 truncate text-sm font-medium tx">{row.player.name}</span>
          <span class="chip !px-2 !py-1" style="background:{row.tier.accent}22;color:{row.tier.accent};">
            {row.tier.icon} {row.tier.title}
          </span>
          <span class="mono text-xs tx-faint w-8 text-right">{row.tier.value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
