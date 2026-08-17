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
  const visibleChips = $derived(chips.slice(0, 2));
  const extraChips = $derived(chips.length - visibleChips.length);

  const NUMBER_COLOR = { 1: 'var(--accent-gold)', 2: '#CBD5E1', 3: '#D97706' };
  const STRIPE_COLOR = { 1: 'var(--accent-gold)', 2: '#CBD5E1', 3: '#D97706' };
  const numberColor = $derived(NUMBER_COLOR[rank] || 'var(--tx-faint)');
  const stripe = $derived(STRIPE_COLOR[rank] || 'var(--border)');
  const isTop = $derived(rank === 1);
</script>

<div class={isTop ? 'hero-shell hero-shell-gold' : ''}>
<button
  type="button"
  onclick={() => onselect?.(player)}
  class="player-row relative w-full text-left active:scale-[0.99] rounded-[var(--radius-md)] p-3.5 flex items-center gap-3 {isTop ? 'hero-shell-inner' : ''}"
  style={isTop
    ? `border-left:3px solid ${stripe};`
    : `background:var(--surface-1);
       border-top:1px solid var(--border);
       border-right:1px solid var(--border);
       border-bottom:1px solid var(--border);
       border-left:3px solid ${stripe};
       box-shadow:var(--shadow-card);`}
>
  <div class="flex items-center justify-center shrink-0" style="width:20px;min-height:38px;">
    <span class="mono font-bold text-[13px] leading-none" style="color:{numberColor};">{rank}</span>
  </div>

  <Avatar {player} size={38} interactive />

  <div class="min-w-0 flex-1">
    <div class="font-semibold truncate tx text-[14px] leading-tight">{player.name}</div>
    <div class="text-[11px] tx-muted mono flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
      <span>{player.matchesPlayed}P</span>
      <span class="tx-faint">·</span>
      <span>{player.wins}W {player.losses}L</span>
      <span class="tx-faint">·</span>
      <span>{player.pointsWon}pts</span>
      <span class="tx-faint">·</span>
      <span style="color:{diff >= 0 ? 'var(--accent-fg)' : 'var(--color-hot)'};">{diff >= 0 ? '+' : ''}{diff}</span>
    </div>
    {#if chips.length}
      <div class="flex flex-wrap items-center gap-1 mt-1 max-w-full" style="padding-right:12px;">
        {#each visibleChips as c}
          <span class="chip-neutral" style="background:{c.accent}26;border-color:{c.accent}40;color:{c.accent};">
            <span class="chip-dot" style="background:{c.accent};"></span>{c.title}
          </span>
        {/each}
        {#if extraChips > 0}
          <span class="chip-neutral" style="color:var(--tx-faint);">+{extraChips}</span>
        {/if}
      </div>
    {/if}
  </div>

  <div class="text-right shrink-0">
    <div class="mono font-bold leading-none text-[18px]" style="color:var(--accent-fg);">
      {byWinrate ? wr : avg}{#if byWinrate}<span class="text-[10px] align-top">%</span>{/if}
    </div>
    <div class="text-[9px] uppercase tracking-[0.12em] tx-faint font-bold mt-0.5">
      {byWinrate ? 'win %' : 'pts/game'}
    </div>
  </div>
</button>
</div>

<style>
  .player-row {
    transition: transform 200ms var(--ease-spring), box-shadow 150ms var(--ease-out-smooth), border-color 150ms var(--ease-out-smooth);
  }
  .player-row::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--overlay-1);
    opacity: 0;
    pointer-events: none;
    transition: opacity 150ms var(--ease-out-smooth);
  }
  @media (hover: hover) {
    .player-row:hover::after {
      opacity: 1;
    }
  }
</style>

