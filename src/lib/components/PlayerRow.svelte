<script>
  import Avatar from './Avatar.svelte';
  import { winRate, pointDiff, form } from '../logic/stats.js';

  let { player, rank } = $props();
  const wr = $derived(winRate(player));
  const diff = $derived(pointDiff(player));
  const f = $derived(form(player));

  const medal = $derived(rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);
  const isTop = $derived(rank === 1);
</script>

<div
  class="glass rounded-3xl px-3 py-3 flex items-center gap-3 relative overflow-hidden"
  style={isTop
    ? 'border-color:rgba(198,255,50,0.45);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 0 34px -12px rgba(198,255,50,0.75);'
    : ''}
>
  {#if isTop}
    <div class="absolute -left-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-30 animate-glow"
         style="background:{player.avatarColor};"></div>
  {/if}

  <div class="w-8 text-center shrink-0 relative z-10">
    {#if medal}
      <span class="text-2xl">{medal}</span>
    {:else}
      <span class="h-display font-extrabold text-lg tx-faint">{rank}</span>
    {/if}
  </div>

  <div class="relative z-10"><Avatar {player} size={isTop ? 46 : 42} /></div>

  <div class="min-w-0 flex-1 relative z-10">
    <div class="flex items-center gap-2">
      <span class="h-display font-bold truncate tx {isTop ? 'text-[17px]' : 'text-[15px]'}">{player.name}</span>
      <span class="chip py-0.5 px-1.5 text-[13px] leading-none" style="background:color-mix(in srgb, var(--tx) 8%, transparent);" title={f.label}>{f.icon}</span>
    </div>
    <div class="text-xs tx-muted flex items-center gap-2 mt-0.5">
      <span class="mono font-semibold">{player.wins}W · {player.losses}L</span>
      <span class="tx-faint">|</span>
      <span class="mono font-semibold {diff >= 0 ? 'neon-text' : 'accent-el'}"
            style={diff >= 0 ? '' : 'color:#ff5e3a;'}>
        {diff >= 0 ? '+' : ''}{diff}
      </span>
    </div>
  </div>

  <div class="text-right shrink-0 relative z-10">
    {#if isTop}
      <div class="mono font-extrabold leading-none text-[30px] neon-text">
        {wr}<span class="text-sm align-top">%</span>
      </div>
    {:else}
      <div class="mono font-extrabold leading-none text-[26px] tx">
        {wr}<span class="text-sm align-top">%</span>
      </div>
    {/if}
    <div class="text-[9px] uppercase tracking-[0.16em] tx-faint font-bold h-display">win rate</div>
  </div>
</div>
