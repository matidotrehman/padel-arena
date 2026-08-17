<script>
  import { fade } from 'svelte/transition';
  import { Grid3x3, X } from '@lucide/svelte';
  import { players } from '../stores/store.js';
  import { filteredMatches } from '../stores/analytics.js';
  import { computeFullDuoMatrix } from '../logic/analyticsEngine.js';
  import Avatar from './Avatar.svelte';

  let viewMode = $state('partner'); // 'partner' or 'vs'
  let selectedPair = $state(null); // { p1, p2, cell }

  const matrix = $derived(computeFullDuoMatrix($players, $filteredMatches));

  function selectCell(p1, p2, cell) {
    if (p1.id === p2.id) return;
    if (selectedPair?.p1.id === p1.id && selectedPair?.p2.id === p2.id) {
      selectedPair = null;
    } else {
      selectedPair = { p1, p2, cell };
    }
  }

  function getCellStyle(cell, mode) {
    if (mode === 'partner') {
      const total = cell.partnerWins + cell.partnerLosses;
      if (!total) return 'background:var(--overlay-1);color:var(--tx-faint);';
      const pct = Math.round((cell.partnerWins / total) * 100);
      if (pct >= 70)
        return 'background:color-mix(in srgb, var(--color-neon-green) 24%, transparent);color:var(--color-neon-green);font-weight:800;';
      if (pct >= 50)
        return 'background:color-mix(in srgb, var(--color-neon-cyan) 20%, transparent);color:var(--color-neon-cyan);font-weight:700;';
      return 'background:color-mix(in srgb, var(--color-hot) 18%, transparent);color:var(--color-hot);font-weight:700;';
    } else {
      const total = cell.vsWins + cell.vsLosses;
      if (!total) return 'background:var(--overlay-1);color:var(--tx-faint);';
      const pct = Math.round((cell.vsWins / total) * 100);
      if (pct >= 60)
        return 'background:color-mix(in srgb, var(--color-neon-green) 22%, transparent);color:var(--color-neon-green);font-weight:800;';
      if (pct >= 40)
        return 'background:color-mix(in srgb, var(--color-ice) 18%, transparent);color:var(--color-ice);font-weight:700;';
      return 'background:color-mix(in srgb, var(--color-hot) 18%, transparent);color:var(--color-hot);font-weight:700;';
    }
  }

  function getCellDisplay(cell, mode) {
    if (mode === 'partner') {
      const total = cell.partnerWins + cell.partnerLosses;
      if (!total) return '–';
      return `${Math.round((cell.partnerWins / total) * 100)}%`;
    } else {
      const total = cell.vsWins + cell.vsLosses;
      if (!total) return '–';
      return `${cell.vsWins}-${cell.vsLosses}`;
    }
  }
</script>

<div class="card space-y-3">
  <div class="flex items-center justify-between gap-2">
    <div>
      <h3 class="font-display font-bold neon-text text-base flex items-center gap-1.5">
        <Grid3x3 size={16} strokeWidth={2.25} /> Pair Chemistry Heatmap
      </h3>
      <p class="text-xs tx-muted">Complete NxN grid of all partner &amp; rivalry stats</p>
    </div>
    <!-- Mode Toggle -->
    <div class="glass rounded-[var(--radius-md)] p-0.5 flex items-center shrink-0">
      <button
        class="px-2 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all active:scale-95 {viewMode === 'partner'
          ? 'accent-el'
          : 'tx-faint'}"
        style={viewMode === 'partner' ? 'background:color-mix(in srgb, var(--accent-fg) 20%, transparent);color:var(--accent-fg);' : ''}
        onclick={() => (viewMode = 'partner')}
      >
        As Partners
      </button>
      <button
        class="px-2 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all active:scale-95 {viewMode === 'vs'
          ? ''
          : 'tx-faint'}"
        style={viewMode === 'vs' ? 'background:color-mix(in srgb, var(--color-ice) 20%, transparent);color:var(--color-ice);' : ''}
        onclick={() => (viewMode = 'vs')}
      >
        Rivals (VS)
      </button>
    </div>
  </div>

  <!-- Heatmap Matrix Table -->
  <div class="overflow-x-auto rounded-[var(--radius-md)] border glass p-1" style="border-color:var(--border);">
    <table class="w-full text-center border-collapse">
      <thead>
        <tr>
          <th class="p-1 text-[10px] tx-faint font-bold text-left">Player</th>
          {#each $players as p}
            <th class="p-1 text-center min-w-[42px]">
              <div class="flex justify-center" title={p.name}>
                <Avatar player={p} size={22} />
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each $players as p1}
          <tr class="border-t" style="border-color:var(--border);">
            <td class="p-1.5 text-xs font-bold tx truncate max-w-[70px] text-left flex items-center gap-1">
              <Avatar player={p1} size={18} />
              <span class="truncate">{p1.name}</span>
            </td>
            {#each $players as p2}
              {@const isSelf = p1.id === p2.id}
              {@const cell = matrix[p1.id]?.[p2.id]}
              {@const isSelected = selectedPair?.p1.id === p1.id && selectedPair?.p2.id === p2.id}
              <td class="p-1">
                {#if isSelf}
                  <div class="w-full h-8 rounded-[var(--radius-sm)] grid place-items-center text-xs tx-faint opacity-40" style="background:var(--overlay-1);">
                    —
                  </div>
                {:else if cell}
                  <button
                    class="w-full h-8 rounded-[var(--radius-sm)] grid place-items-center text-xs transition-all active:scale-95 {isSelected
                      ? 'scale-105 z-10 ring-2'
                      : ''}"
                    style="{getCellStyle(cell, viewMode)}{isSelected ? 'box-shadow:0 0 0 2px var(--accent-fg);' : ''}"
                    onclick={() => selectCell(p1, p2, cell)}
                  >
                    {getCellDisplay(cell, viewMode)}
                  </button>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Selected Pair Detail Card -->
  {#if selectedPair}
    {@const { p1, p2, cell } = selectedPair}
    {@const partTotal = cell.partnerWins + cell.partnerLosses}
    {@const partPct = partTotal ? Math.round((cell.partnerWins / partTotal) * 100) : 0}
    {@const vsTotal = cell.vsWins + cell.vsLosses}
    {@const vsPct = vsTotal ? Math.round((cell.vsWins / vsTotal) * 100) : 0}

    <div
      class="glass rounded-[var(--radius-md)] p-3 space-y-2"
      style="border-color:color-mix(in srgb, var(--accent-fg) 30%, transparent);"
      in:fade={{ duration: 200 }}
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="flex items-center -space-x-2">
            <Avatar player={p1} size={28} />
            <Avatar player={p2} size={28} />
          </div>
          <div>
            <h4 class="text-sm font-bold tx">
              {p1.name} &amp; {p2.name}
            </h4>
            <span class="text-[10px] tx-faint">Detailed Partnership &amp; Matchup Stats</span>
          </div>
        </div>
        <button
          class="tx-faint hover:tx p-1 rounded-[var(--radius-sm)] transition active:scale-90"
          onclick={() => (selectedPair = null)}
          aria-label="Close"
        >
          <X size={14} strokeWidth={2.25} />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-center pt-1">
        <div class="glass rounded-[var(--radius-sm)] p-2">
          <div class="text-[10px] uppercase font-bold tx-faint">As Partners</div>
          {#if partTotal > 0}
            <div class="mono font-extrabold text-lg neon-text">{partPct}%</div>
            <div class="text-[11px] tx-faint">{cell.partnerWins}W – {cell.partnerLosses}L ({partTotal} games)</div>
            <div class="text-[10px] tx-faint mt-0.5">{cell.partnerPtsFor}–{cell.partnerPtsAgainst} pts</div>
          {:else}
            <div class="text-xs tx-faint italic py-1">No partner games</div>
          {/if}
        </div>

        <div class="glass rounded-[var(--radius-sm)] p-2">
          <div class="text-[10px] uppercase font-bold tx-faint">Head-to-Head (VS)</div>
          {#if vsTotal > 0}
            <div class="mono font-extrabold text-lg" style="color:var(--color-ice);">{vsPct}% win for {p1.name}</div>
            <div class="text-[11px] tx-faint">{cell.vsWins}W – {cell.vsLosses}L ({vsTotal} matches)</div>
          {:else}
            <div class="text-xs tx-faint italic py-1">No opponent matches</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
