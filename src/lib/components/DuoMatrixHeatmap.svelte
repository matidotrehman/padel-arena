<script>
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
      if (!total) return 'background:rgba(255,255,255,0.03);color:var(--tx-faint,#64748b);';
      const pct = Math.round((cell.partnerWins / total) * 100);
      if (pct >= 70)
        return 'background:color-mix(in srgb, var(--color-neon-green, #b6ff2e) 24%, transparent);color:var(--color-neon-green, #b6ff2e);font-weight:800;';
      if (pct >= 50)
        return 'background:rgba(34, 224, 200, 0.18);color:#22e0c8;font-weight:700;';
      return 'background:rgba(255, 94, 58, 0.16);color:#ff5e3a;font-weight:700;';
    } else {
      const total = cell.vsWins + cell.vsLosses;
      if (!total) return 'background:rgba(255,255,255,0.03);color:var(--tx-faint,#64748b);';
      const pct = Math.round((cell.vsWins / total) * 100);
      if (pct >= 60)
        return 'background:color-mix(in srgb, var(--color-neon-green, #b6ff2e) 22%, transparent);color:var(--color-neon-green, #b6ff2e);font-weight:800;';
      if (pct >= 40)
        return 'background:rgba(56, 189, 248, 0.16);color:#38bdf8;font-weight:700;';
      return 'background:rgba(255, 94, 58, 0.16);color:#ff5e3a;font-weight:700;';
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
        <span>🧩</span> Pair Chemistry Heatmap
      </h3>
      <p class="text-xs tx-muted">Complete NxN grid of all partner &amp; rivalry stats</p>
    </div>
    <!-- Mode Toggle -->
    <div class="glass rounded-xl p-0.5 flex items-center shrink-0">
      <button
        class="px-2 py-1 rounded-lg text-xs font-bold transition-all {viewMode === 'partner'
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'tx-faint'}"
        onclick={() => (viewMode = 'partner')}
      >
        As Partners
      </button>
      <button
        class="px-2 py-1 rounded-lg text-xs font-bold transition-all {viewMode === 'vs'
          ? 'bg-sky-500/20 text-sky-300'
          : 'tx-faint'}"
        onclick={() => (viewMode = 'vs')}
      >
        Rivals (VS)
      </button>
    </div>
  </div>

  <!-- Heatmap Matrix Table -->
  <div class="overflow-x-auto rounded-xl border border-white/10 glass p-1">
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
          <tr class="border-t border-white/5">
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
                  <div class="w-full h-8 rounded-lg grid place-items-center bg-white/5 text-xs tx-faint opacity-40">
                    —
                  </div>
                {:else if cell}
                  <button
                    class="w-full h-8 rounded-lg grid place-items-center text-xs transition-all active:scale-95 {isSelected
                      ? 'ring-2 ring-emerald-400 scale-105 z-10'
                      : ''}"
                    style={getCellStyle(cell, viewMode)}
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

    <div class="glass rounded-xl p-3 border border-emerald-500/30 space-y-2 animate-in fade-in duration-200">
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
          class="text-xs tx-faint hover:tx p-1"
          onclick={() => (selectedPair = null)}
        >
          ✕
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-center pt-1">
        <div class="glass rounded-lg p-2">
          <div class="text-[10px] uppercase font-bold tx-faint">As Partners</div>
          {#if partTotal > 0}
            <div class="mono font-extrabold text-lg neon-text">{partPct}%</div>
            <div class="text-[11px] tx-faint">{cell.partnerWins}W – {cell.partnerLosses}L ({partTotal} games)</div>
            <div class="text-[10px] tx-faint mt-0.5">{cell.partnerPtsFor}–{cell.partnerPtsAgainst} pts</div>
          {:else}
            <div class="text-xs tx-faint italic py-1">No partner games</div>
          {/if}
        </div>

        <div class="glass rounded-lg p-2">
          <div class="text-[10px] uppercase font-bold tx-faint">Head-to-Head (VS)</div>
          {#if vsTotal > 0}
            <div class="mono font-extrabold text-lg text-sky-400">{vsPct}% win for {p1.name}</div>
            <div class="text-[11px] tx-faint">{cell.vsWins}W – {cell.vsLosses}L ({vsTotal} matches)</div>
          {:else}
            <div class="text-xs tx-faint italic py-1">No opponent matches</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
