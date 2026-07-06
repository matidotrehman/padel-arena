<script>
  import Avatar from './Avatar.svelte';
  import { winRate, pointDiff, form } from '../logic/stats.js';

  let { player, rank } = $props();
  const wr = $derived(winRate(player));
  const diff = $derived(pointDiff(player));
  const f = $derived(form(player));

  const medal = $derived(rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);
</script>

<div
  class="glass rounded-2xl px-3 py-3 flex items-center gap-3"
  style="border-color:{rank === 1 ? 'rgba(182,255,46,0.35)' : 'rgba(255,255,255,0.07)'};
         {rank === 1 ? 'box-shadow:0 0 24px -10px rgba(182,255,46,0.6);' : ''}"
>
  <div class="w-7 text-center font-display font-bold text-lg shrink-0">
    {#if medal}<span class="text-xl">{medal}</span>{:else}<span class="text-white/40">{rank}</span>{/if}
  </div>

  <Avatar {player} size={42} />

  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-2">
      <span class="font-semibold truncate">{player.name}</span>
      <span class="text-sm" title={f.label}>{f.icon}</span>
    </div>
    <div class="text-xs text-white/45 flex items-center gap-2">
      <span>{player.wins}W · {player.losses}L</span>
      <span class="text-white/25">|</span>
      <span style="color:{diff >= 0 ? '#b6ff2e' : '#ff5e3a'};">
        {diff >= 0 ? '+' : ''}{diff} pts
      </span>
    </div>
  </div>

  <div class="text-right shrink-0">
    <div class="font-display text-2xl font-bold leading-none neon-text">{wr}<span class="text-sm">%</span></div>
    <div class="text-[10px] uppercase tracking-widest text-white/35">win rate</div>
  </div>
</div>
