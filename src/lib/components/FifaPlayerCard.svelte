<script>
  import Avatar from './Avatar.svelte';
  import { fifaRating, form, avgPoints, winRate } from '../logic/stats.js';

  let { player, badges = [], mode = 'points', onselect } = $props();

  const rating = $derived(fifaRating(player));
  const f = $derived(form(player));
  const earned = $derived(badges.filter((b) => b.winner && b.winner.id === player.id));
  const stat = $derived(mode === 'winrate' ? `${winRate(player)}%` : `${avgPoints(player)} pg`);
</script>

<button
  type="button"
  onclick={() => onselect?.(player)}
  class="glass rounded-3xl p-3 pt-2 flex flex-col items-center gap-1 text-center relative overflow-hidden active:scale-[0.98] transition w-full"
  style="border-color:color-mix(in srgb, var(--color-gold) 20%, var(--border));"
>
  <div class="w-full flex items-start justify-between">
    <span class="mono font-extrabold text-lg leading-none" style="color:var(--color-gold);">{rating}</span>
    <span class="text-base leading-none" title={f.label}>{f.icon}</span>
  </div>

  <Avatar {player} size={56} />

  <div class="h-display font-bold text-sm truncate max-w-full tx mt-0.5">{player.name}</div>
  <div class="mono text-xs tx-muted">{stat}</div>

  {#if earned.length}
    <div class="flex flex-wrap justify-center gap-1 mt-1">
      {#each earned as b (b.key)}
        <span class="text-sm" title={b.title}>{b.icon}</span>
      {/each}
    </div>
  {/if}
</button>
