<script>
  import Avatar from './Avatar.svelte';
  import { winRate, pointDiff, avgPoints } from '../logic/stats.js';
  import { computeTierBadge } from '../logic/badges.js';

  let { player, rank, mode = 'points', badges = [], tierPool = [], onselect } = $props();
  const wr = $derived(winRate(player));
  const diff = $derived(pointDiff(player));
  const avg = $derived(avgPoints(player));
  const byWinrate = $derived(mode === 'winrate');
  const earned = $derived(badges.filter((b) => b.winner && b.winner.id === player.id));
  const tier = $derived(computeTierBadge(player, tierPool));
  const chips = $derived([...(tier ? [tier] : []), ...earned]);
  const visibleChips = $derived(chips.slice(0, 3));
  const extraChips = $derived(chips.length - visibleChips.length);

  const RANK_COLOR = { 1: '#B8860B', 2: '#94A3B8', 3: '#B45309' };
  const stripe = $derived(RANK_COLOR[rank] || 'var(--border)');
</script>

<button
  type="button"
  onclick={() => onselect?.(player)}
  class="relative w-full text-left transition active:scale-[0.99] rounded-lg pl-3 pr-3 py-2.5 flex items-center gap-3"
  style="background:var(--surface-1);border-top:1px solid var(--border);border-right:1px solid var(--border);border-bottom:1px solid var(--border);border-left:3px solid {stripe};"
>
  <div class="w-5 text-center shrink-0">
    <span class="mono font-bold text-[13px]" style={rank <= 3 ? `color:${stripe};` : 'color:var(--tx-faint);'}>{rank}</span>
  </div>

  <Avatar {player} size={38} />

  <div class="min-w-0 flex-1">
    <div class="font-semibold truncate tx text-[14px] leading-tight">{player.name}</div>
    <div class="text-[11px] tx-muted mono flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
      <span>{player.matchesPlayed}P</span>
      <span class="tx-faint">·</span>
      <span>{player.wins}W {player.losses}L</span>
      <span class="tx-faint">·</span>
      <span>{player.pointsWon}pts</span>
      <span class="tx-faint">·</span>
      <span style="color:{diff >= 0 ? 'var(--accent-fg)' : '#DC2626'};">{diff >= 0 ? '+' : ''}{diff}</span>
    </div>
    {#if chips.length}
      <div class="flex items-center gap-1 mt-1">
        {#each visibleChips as c}
          <span class="chip-neutral">{c.title}</span>
        {/each}
        {#if extraChips > 0}
          <span class="text-[10px] tx-faint font-semibold">+{extraChips}</span>
        {/if}
      </div>
    {/if}
  </div>

  <div class="text-right shrink-0">
    <div class="mono font-bold leading-none text-[18px] tx">
      {byWinrate ? wr : avg}{#if byWinrate}<span class="text-[10px] align-top">%</span>{/if}
    </div>
    <div class="text-[9px] uppercase tracking-[0.12em] tx-faint font-bold mt-0.5">
      {byWinrate ? 'win %' : 'pts/game'}
    </div>
  </div>
</button>
