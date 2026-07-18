<script>
  import { fly, fade } from 'svelte/transition';
  import { players, matches } from '../stores/store.js';
  import { headToHead, record, totalEncounters } from '../logic/h2h.js';
  import { winRate, avgPoints, pointDiff, form } from '../logic/stats.js';
  import Avatar from './Avatar.svelte';

  let { player, onclose } = $props();

  const h2h = $derived(headToHead($matches));
  const f = $derived(form(player));

  const rows = $derived(
    $players
      .filter((p) => p.id !== player.id)
      .map((q) => {
        const rec = record(h2h, player.id, q.id);
        return { q, rec, total: totalEncounters(rec), diff: rec.oppPF - rec.oppPA };
      })
      .sort((a, b) => b.total - a.total || a.q.name.localeCompare(b.q.name))
  );
</script>

<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-sm"
     transition:fade={{ duration: 150 }}
     onclick={(e) => { if (e.target === e.currentTarget) onclose(); }} role="presentation">
  <div class="glass rounded-3xl w-full max-w-md max-h-[85dvh] overflow-y-auto p-5 space-y-4"
       transition:fly={{ y: 30, duration: 250 }} role="dialog" aria-modal="true" tabindex="-1">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Avatar {player} size={52} />
      <div class="min-w-0 flex-1">
        <div class="h-display font-extrabold text-xl truncate tx">{player.name} <span class="text-base">{f.icon}</span></div>
        <div class="text-xs tx-muted mono">
          {player.matchesPlayed} games · {player.wins}W {player.losses}L · {winRate(player)}% ·
          <span class={pointDiff(player) >= 0 ? 'neon-text' : ''} style={pointDiff(player) >= 0 ? '' : 'color:#ff5e3a'}>
            {pointDiff(player) >= 0 ? '+' : ''}{pointDiff(player)}
          </span>
        </div>
      </div>
      <div class="text-right shrink-0">
        <div class="mono font-extrabold text-2xl neon-text leading-none">{avgPoints(player)}</div>
        <div class="text-[9px] uppercase tracking-widest tx-faint font-bold">pts / game</div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="label !mb-0">Head-to-head</div>
      <div class="text-[10px] tx-faint">vs = opponents · with = partners</div>
    </div>

    <!-- Per-opponent rows -->
    <div class="space-y-1.5">
      {#each rows as { q, rec, total, diff } (q.id)}
        <div class="glass rounded-xl px-3 py-2 flex items-center gap-2.5">
          <Avatar player={q} size={30} />
          <span class="flex-1 truncate text-sm font-medium tx">{q.name}</span>
          {#if total === 0}
            <span class="text-xs tx-faint">Haven't played</span>
          {:else}
            <div class="text-right leading-tight">
              <div class="text-sm mono font-bold">
                <span class="tx-faint text-[11px] font-normal">vs</span>
                <span class={rec.oppW > rec.oppL ? 'neon-text' : rec.oppW < rec.oppL ? 'accent-el' : 'tx'}
                      style={rec.oppW < rec.oppL ? 'color:#ff5e3a' : ''}>{rec.oppW}–{rec.oppL}</span>
                {#if rec.oppW + rec.oppL > 0}
                  <span class="text-[11px] {diff >= 0 ? 'neon-text' : 'accent-el'}" style={diff >= 0 ? '' : 'color:#ff5e3a'}>
                    {diff >= 0 ? '+' : ''}{diff}
                  </span>
                {/if}
              </div>
              <div class="text-[11px] tx-muted mono">
                <span class="tx-faint">with</span> {rec.partW}–{rec.partL}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <button class="btn btn-ghost w-full" onclick={onclose}>Close</button>
  </div>
</div>
