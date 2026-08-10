<script>
  import Avatar from './Avatar.svelte';
  import { winRate, pointDiff, avgPoints, form } from '../logic/stats.js';
  import { computeTierBadge } from '../logic/badges.js';

  let { player, rank, mode = 'points', badges = [], tierPool = [], onselect } = $props();
  const wr = $derived(winRate(player));
  const diff = $derived(pointDiff(player));
  const avg = $derived(avgPoints(player));
  const f = $derived(form(player));
  const byWinrate = $derived(mode === 'winrate');
  const earned = $derived(badges.filter((b) => b.winner && b.winner.id === player.id));
  const tier = $derived(computeTierBadge(player, tierPool));
  const chips = $derived([...(tier ? [tier] : []), ...earned]);
  const visibleChips = $derived(chips.slice(0, 2));
  const extraChips = $derived(chips.length - visibleChips.length);

  const medal = $derived(rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);
  const isTop = $derived(rank === 1);
  const stripe = $derived(isTop ? 'var(--color-gold)' : player.avatarColor || 'var(--accent-fg)');
</script>

<button
  type="button"
  onclick={() => onselect?.(player)}
  class="relative w-full text-left transition active:scale-[0.99] rounded-2xl pl-3.5 pr-3.5 flex flex-col gap-2 {isTop ? 'py-3.5' : 'py-3'}"
  style="
    background:{isTop
      ? 'color-mix(in srgb, var(--color-gold) 8%, var(--surface-1))'
      : 'var(--surface-1)'};
    border:1px solid {isTop ? 'color-mix(in srgb, var(--color-gold) 30%, var(--border))' : 'var(--border)'};
    border-left:3px solid {stripe};
  "
>
  {#if isTop}
    <div class="flex items-center gap-3.5">
      <div class="relative shrink-0">
        <Avatar {player} size={54} />
        <span class="absolute -bottom-1 -right-1 text-base leading-none">🥇</span>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <span class="h-display font-extrabold truncate tx text-[18px] leading-tight">{player.name}</span>
          <span class="text-[13px] leading-none" title={f.label}>{f.icon}</span>
        </div>
        <div class="text-[11px] tx-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 mono font-semibold">
          <span>{player.matchesPlayed}p</span>
          <span class="tx-faint">·</span>
          <span>{player.wins}W {player.losses}L</span>
          <span class="tx-faint">·</span>
          <span>{player.pointsWon}pts</span>
          <span class="tx-faint">·</span>
          <span class={diff >= 0 ? 'neon-text' : ''} style={diff >= 0 ? '' : 'color:#ff5e3a;'}>{diff >= 0 ? '+' : ''}{diff}</span>
        </div>
      </div>
      <div class="text-right shrink-0">
        <div class="mono font-extrabold leading-none text-[30px]" style="color:var(--color-gold);">
          {byWinrate ? wr : avg}{#if byWinrate}<span class="text-sm align-top">%</span>{/if}
        </div>
        <div class="text-[9px] uppercase tracking-[0.16em] tx-faint font-bold h-display">
          {byWinrate ? 'win rate' : 'pts / game'}
        </div>
      </div>
    </div>
  {:else}
    <div class="flex items-center gap-3">
      <div class="w-7 text-center shrink-0">
        {#if medal}
          <span class="text-xl">{medal}</span>
        {:else}
          <span class="h-display font-extrabold text-base tx-faint">{rank}</span>
        {/if}
      </div>

      <Avatar {player} size={40} />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="h-display font-bold truncate tx text-[15px]">{player.name}</span>
          <span class="text-[13px] leading-none" title={f.label}>{f.icon}</span>
        </div>
        <div class="text-[11px] tx-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 mono font-semibold">
          <span>{player.matchesPlayed}p</span>
          <span class="tx-faint">·</span>
          <span>{player.wins}W {player.losses}L</span>
          <span class="tx-faint">·</span>
          <span>{player.pointsWon}pts</span>
          <span class="tx-faint">·</span>
          <span class={diff >= 0 ? 'neon-text' : ''} style={diff >= 0 ? '' : 'color:#ff5e3a;'}>{diff >= 0 ? '+' : ''}{diff}</span>
        </div>
      </div>

      <div class="text-right shrink-0">
        <div class="mono font-extrabold leading-none text-[24px] tx">
          {byWinrate ? wr : avg}{#if byWinrate}<span class="text-sm align-top">%</span>{/if}
        </div>
        <div class="text-[9px] uppercase tracking-[0.16em] tx-faint font-bold h-display">
          {byWinrate ? 'win rate' : 'pts / game'}
        </div>
      </div>
    </div>
  {/if}

  {#if chips.length}
    <div class="flex items-center gap-1 {isTop ? '' : 'pl-10'}">
      {#each visibleChips as c}
        <span class="chip !px-1.5 !py-0.5 text-[11px]" style="background:{c.accent}18;color:{c.accent};" title={c.title}>{c.icon} {c.title}</span>
      {/each}
      {#if extraChips > 0}
        <span class="text-[11px] tx-faint font-semibold">+{extraChips}</span>
      {/if}
    </div>
  {/if}
</button>
