<script>
  import { players, matches } from '../stores/store.js';
  import { filteredMatches, rangeRanked } from '../stores/analytics.js';
  import { computeTierPool, computeTierBadge } from '../logic/badges.js';
  import { headToHead, record } from '../logic/h2h.js';
  import { avgPoints } from '../logic/stats.js';
  import Avatar from './Avatar.svelte';
  import { Volleyball, User, Shuffle, Swords, Radio } from '@lucide/svelte';

  const ranked = $derived($rangeRanked.filter((p) => p.matchesPlayed > 0));
  const leader = $derived(ranked[0]);
  const rival = $derived(ranked[1]);
  const tierPool = $derived(computeTierPool($players));
  const leaderTier = $derived(leader ? computeTierBadge(leader, tierPool) : null);

  const h2h = $derived(headToHead($filteredMatches));
  const rivalRecord = $derived(leader && rival ? record(h2h, leader.id, rival.id) : null);
  const rivalGames = $derived(rivalRecord ? rivalRecord.oppW + rivalRecord.oppL : 0);

  const MODES = {
    fixed: { icon: Volleyball, label: 'Fixed 2v2' },
    individual: { icon: User, label: 'Individual' },
    americano: { icon: Shuffle, label: 'Americano' },
  };
  const recent = $derived([...$matches].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 5));

  function timeAgo(ts) {
    if (!ts) return '';
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  }
</script>

<aside class="hidden lg:flex lg:flex-col lg:w-[300px] lg:shrink-0 lg:h-full lg:min-h-0 gap-4 overflow-y-auto">
  <!-- Top player -->
  <div class="rounded-[var(--radius-lg)] p-4 shrink-0"
       style="background:var(--surface-1);border:1px solid var(--border);box-shadow:var(--shadow-card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
    <div class="label !mb-2">Top player</div>
    {#if leader}
      <div class="flex items-center gap-3">
        <Avatar player={leader} size={44} />
        <div class="min-w-0 flex-1">
          <div class="font-semibold tx truncate">{leader.name}</div>
          {#if leaderTier}
            {@const TierIcon = leaderTier.icon}
            <span class="chip-neutral mt-1" style="background:{leaderTier.accent}33;border-color:{leaderTier.accent}66;color:{leaderTier.accent};">
              <TierIcon size={10} strokeWidth={2.5} />{leaderTier.title}
            </span>
          {/if}
        </div>
        <div class="text-right shrink-0">
          <div class="mono font-extrabold text-xl" style="color:var(--accent-volt);">{avgPoints(leader)}</div>
          <div class="text-[9px] uppercase tracking-[0.12em] tx-faint font-bold">pts/game</div>
        </div>
      </div>
    {:else}
      <p class="text-sm tx-muted">No games in this range yet.</p>
    {/if}
  </div>

  <!-- Head-to-head quick summary -->
  {#if leader && rival}
    <div class="rounded-[var(--radius-lg)] p-4 space-y-2.5 shrink-0"
         style="background:var(--surface-1);border:1px solid var(--border);box-shadow:var(--shadow-card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
      <div class="label !mb-0 flex items-center gap-1.5"><Swords size={12} strokeWidth={2.5} /> Head-to-head</div>
      <div class="flex items-center justify-between gap-2 text-sm">
        <div class="flex items-center gap-2 min-w-0">
          <Avatar player={leader} size={26} />
          <span class="tx font-medium truncate">{leader.name}</span>
        </div>
        <span class="mono font-bold tx-faint text-[10px] shrink-0">VS</span>
        <div class="flex items-center gap-2 min-w-0 flex-row-reverse">
          <Avatar player={rival} size={26} />
          <span class="tx font-medium truncate">{rival.name}</span>
        </div>
      </div>
      {#if rivalGames > 0}
        <div class="flex items-center justify-center gap-2 mono font-extrabold text-lg pt-1">
          <span style="color:var(--color-positive);">{rivalRecord.oppW}</span>
          <span class="tx-faint text-[10px] font-semibold">as rivals</span>
          <span style="color:var(--color-hot);">{rivalRecord.oppL}</span>
        </div>
      {:else}
        <p class="text-xs tx-faint text-center pt-1">Haven't faced off yet this range.</p>
      {/if}
    </div>
  {/if}

  <!-- Activity feed -->
  <div class="rounded-[var(--radius-lg)] p-4 space-y-2.5 flex-1 min-h-0 overflow-y-auto"
       style="background:var(--surface-1);border:1px solid var(--border);box-shadow:var(--shadow-card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
    <div class="label !mb-1 flex items-center gap-1.5"><Radio size={12} strokeWidth={2.5} /> Recent activity</div>
    {#if recent.length === 0}
      <p class="text-xs tx-faint">No matches logged yet.</p>
    {:else}
      {#each recent as m (m.id)}
        {@const mode = MODES[m.mode] || MODES.fixed}
        {@const ModeIcon = mode.icon}
        <div class="flex items-center gap-2 text-xs">
          <span class="w-6 h-6 grid place-items-center rounded-full shrink-0" style="background:var(--surface-2);color:var(--accent-fg);">
            <ModeIcon size={12} strokeWidth={2.25} />
          </span>
          <span class="flex-1 truncate tx-muted">{mode.label}</span>
          <span class="tx-faint shrink-0">{timeAgo(m.date)}</span>
        </div>
      {/each}
    {/if}
  </div>
</aside>
