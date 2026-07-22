<script>
  import { players } from '../stores/store.js';
  import { filteredMatches } from '../stores/analytics.js';
  import { headToHead, record, totalEncounters } from '../logic/h2h.js';
  import Avatar from './Avatar.svelte';

  let aId = $state('');
  let bId = $state('');

  $effect(() => {
    if (!aId && $players[0]) aId = $players[0].id;
    if (!bId && $players[1]) bId = $players[1].id;
  });

  const h2h = $derived(headToHead($filteredMatches));
  const playerA = $derived($players.find((p) => p.id === aId));
  const playerB = $derived($players.find((p) => p.id === bId));
  const rec = $derived(playerA && playerB ? record(h2h, aId, bId) : null);
  const total = $derived(rec ? totalEncounters(rec) : 0);
</script>

<div class="space-y-2.5">
  <div class="card space-y-1">
    <h3 class="font-display font-bold neon-text">Head-to-Head</h3>
    <p class="text-sm tx-muted">Compare any two players' record — against and with each other.</p>
  </div>

  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
    <select class="input" bind:value={aId}>
      {#each $players as p}<option value={p.id} disabled={p.id === bId}>{p.name}</option>{/each}
    </select>
    <span class="font-display font-bold tx-faint text-sm">VS</span>
    <select class="input" bind:value={bId}>
      {#each $players as p}<option value={p.id} disabled={p.id === aId}>{p.name}</option>{/each}
    </select>
  </div>

  {#if playerA && playerB}
    <div class="card space-y-3">
      <div class="flex items-center justify-center gap-4">
        <div class="flex flex-col items-center gap-1">
          <Avatar player={playerA} size={48} />
          <span class="text-sm font-medium truncate max-w-[90px]">{playerA.name}</span>
        </div>
        <span class="tx-faint text-xs">vs</span>
        <div class="flex flex-col items-center gap-1">
          <Avatar player={playerB} size={48} />
          <span class="text-sm font-medium truncate max-w-[90px]">{playerB.name}</span>
        </div>
      </div>

      {#if total === 0}
        <p class="text-center text-sm tx-faint italic">Haven't played each other yet in this timeframe.</p>
      {:else}
        <div class="grid grid-cols-2 gap-2">
          <div class="glass rounded-xl p-3 text-center">
            <div class="label !mb-1">Against</div>
            {#if rec.oppW + rec.oppL > 0}
              <div class="mono font-extrabold text-2xl {rec.oppW > rec.oppL ? 'neon-text' : 'tx'}"
                   style={rec.oppW < rec.oppL ? 'color:#ff5e3a;' : ''}>{rec.oppW}–{rec.oppL}</div>
              <div class="text-xs tx-faint mono mt-1">{rec.oppPF}–{rec.oppPA} pts</div>
            {:else}
              <span class="tx-faint text-sm">–</span>
            {/if}
          </div>
          <div class="glass rounded-xl p-3 text-center">
            <div class="label !mb-1">With</div>
            {#if rec.partW + rec.partL > 0}
              <div class="mono font-extrabold text-2xl tx">{rec.partW}–{rec.partL}</div>
              <div class="text-xs tx-faint mono mt-1">as partners</div>
            {:else}
              <span class="tx-faint text-sm">–</span>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
