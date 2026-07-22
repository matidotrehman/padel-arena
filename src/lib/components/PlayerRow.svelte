<script>
  import Avatar from './Avatar.svelte';
  import { winRate, pointDiff, avgPoints, form } from '../logic/stats.js';
  import { computeTierBadge } from '../logic/badges.js';

  let { player, rank, mode = 'points', badges = [], onselect } = $props();
  const wr = $derived(winRate(player));
  const diff = $derived(pointDiff(player));
  const avg = $derived(avgPoints(player));
  const f = $derived(form(player));
  const byWinrate = $derived(mode === 'winrate');
  const earned = $derived(badges.filter((b) => b.winner && b.winner.id === player.id));
  const tier = $derived(computeTierBadge(player));

  const medal = $derived(rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);
  const isTop = $derived(rank === 1);
</script>

<button
  type="button"
  onclick={() => onselect?.(player)}
  class="glass rounded-3xl px-3 py-3 flex flex-col gap-1.5 relative overflow-hidden w-full text-left transition active:scale-[0.99]"
  style={isTop
    ? 'border-color:color-mix(in srgb, var(--color-gold) 45%, transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 0 34px -12px color-mix(in srgb, var(--color-gold) 75%, transparent);'
    : ''}
>
  {#if isTop}
    <div class="absolute -left-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-30 animate-glow"
         style="background:var(--color-gold);"></div>
  {/if}

  <div class="flex items-center gap-3 relative z-10">
    <div class="w-8 text-center shrink-0">
      {#if medal}
        <span class="text-2xl">{medal}</span>
      {:else}
        <span class="h-display font-extrabold text-lg tx-faint">{rank}</span>
      {/if}
    </div>

    <Avatar {player} size={isTop ? 46 : 42} />

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="h-display font-bold truncate tx {isTop ? 'text-[17px]' : 'text-[15px]'}">{player.name}</span>
        <span class="chip py-0.5 px-1.5 text-[13px] leading-none" style="background:color-mix(in srgb, var(--tx) 8%, transparent);" title={f.label}>{f.icon}</span>
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
      <div class="mono font-extrabold leading-none {isTop ? 'text-[30px] neon-text' : 'text-[26px] tx'}">
        {byWinrate ? wr : avg}{#if byWinrate}<span class="text-sm align-top">%</span>{/if}
      </div>
      <div class="text-[9px] uppercase tracking-[0.16em] tx-faint font-bold h-display">
        {byWinrate ? 'win rate' : 'pts / game'}
      </div>
    </div>
  </div>

  {#if tier || earned.length}
    <div class="flex flex-wrap gap-1 pl-11 relative z-10">
      {#if tier}
        <span class="chip !px-1.5 !py-0.5 text-[11px]" style="background:{tier.accent}22;color:{tier.accent};" title="{tier.title} tier · rating {tier.value}">{tier.icon} {tier.title}</span>
      {/if}
      {#each earned as b (b.key)}
        <span class="chip !px-1.5 !py-0.5 text-[11px]" style="background:{b.accent}22;color:{b.accent};" title={b.title}>{b.icon} {b.title}</span>
      {/each}
    </div>
  {/if}
</button>
