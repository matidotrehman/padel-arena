<script>
  import { players } from '../stores/store.js';
  import { filteredMatches } from '../stores/analytics.js';
  import { computeChemistry } from '../logic/chemistry.js';
  import Avatar from './Avatar.svelte';

  const chem = $derived(computeChemistry($players, $filteredMatches));
</script>

<div class="space-y-2.5">
  <div class="card space-y-1">
    <h3 class="font-display font-bold neon-text">Chemistry Matrix</h3>
    <p class="text-sm tx-muted">Every possible partnership, ranked by win rate as a team.</p>
  </div>

  {#if !chem.ranked.length}
    <div class="card text-center py-8 tx-muted">
      <div class="text-4xl mb-2">🧪</div>
      <p class="font-semibold tx">Not enough partnered games yet</p>
      <p class="text-sm">Pairs need at least 2 games together to show up here.</p>
    </div>
  {:else}
    <div class="space-y-1.5">
      {#each chem.ranked as p, i (p.a.id + p.b.id)}
        <div class="glass rounded-xl px-3 py-2.5 flex items-center gap-2.5">
          <div class="flex items-center -space-x-2 shrink-0">
            <Avatar player={p.a} size={30} />
            <Avatar player={p.b} size={30} />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium tx truncate">{p.a.name} &amp; {p.b.name}</div>
            <div class="text-[11px] tx-faint mono">{p.wins}W {p.losses}L · {p.games} games</div>
          </div>
          {#if i === 0}
            <span class="chip" style="background:color-mix(in srgb, var(--color-neon-green) 16%, transparent);color:var(--color-neon-green);">🔥 Unstoppable</span>
          {:else if i === chem.ranked.length - 1 && chem.ranked.length > 1}
            <span class="chip" style="background:rgba(56,189,248,0.16);color:#38bdf8;">🧊 Toxic</span>
          {/if}
          <span class="mono font-bold text-lg tx shrink-0">{p.winRate}%</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if chem.untested.length}
    <div class="text-[11px] tx-faint text-center pt-1">
      {chem.untested.length} pair{chem.untested.length === 1 ? '' : 's'} untested (fewer than 2 games together)
    </div>
  {/if}
</div>
