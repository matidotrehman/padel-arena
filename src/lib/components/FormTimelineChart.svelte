<script>
  import { players } from '../stores/store.js';
  import { filteredMatches } from '../stores/analytics.js';
  import { computeFormTimeline } from '../logic/analyticsEngine.js';
  import Avatar from './Avatar.svelte';

  let selectedPlayerId = $state('all');
  let hoveredPoint = $state(null);

  const timelineData = $derived(computeFormTimeline($players, $filteredMatches));
  const points = $derived(timelineData.timelinePoints);

  const activePlayers = $derived(
    selectedPlayerId === 'all'
      ? $players
      : $players.filter((p) => p.id === selectedPlayerId)
  );

  const WIDTH = 340;
  const HEIGHT = 180;
  const PADDING_LEFT = 32;
  const PADDING_RIGHT = 15;
  const PADDING_TOP = 15;
  const PADDING_BOTTOM = 25;

  const chartW = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartH = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  function getX(idx, total) {
    if (total <= 1) return PADDING_LEFT + chartW / 2;
    return PADDING_LEFT + ((idx - 1) / (total - 1)) * chartW;
  }

  function getY(winRate) {
    const val = Math.max(0, Math.min(100, winRate));
    return PADDING_TOP + (1 - val / 100) * chartH;
  }

  function getPlayerPath(playerId) {
    if (!points.length) return '';
    return points
      .map((pt, i) => {
        const rate = pt.rates[playerId] ?? 0;
        const x = getX(i + 1, points.length);
        const y = getY(rate);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const yTicks = [0, 25, 50, 75, 100];
</script>

<div class="card space-y-3">
  <div class="flex items-center justify-between gap-2">
    <div>
      <h3 class="font-display font-bold neon-text text-base flex items-center gap-1.5">
        <span>📈</span> Rank &amp; Form Timeline
      </h3>
      <p class="text-xs tx-muted">Match-by-match win rate trajectory</p>
    </div>

    <!-- Filter Dropdown -->
    <select class="input text-xs !py-1 !px-2 w-auto" bind:value={selectedPlayerId}>
      <option value="all">All Players</option>
      {#each $players as p}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select>
  </div>

  {#if !points.length}
    <div class="glass rounded-xl p-8 text-center tx-faint text-xs italic">
      No matches logged yet to plot form timeline.
    </div>
  {:else}
    <div class="relative flex justify-center pt-1">
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} class="overflow-visible select-none">
        <!-- Y-Axis Grid & Labels -->
        {#each yTicks as tick}
          {@const y = getY(tick)}
          <line
            x1={PADDING_LEFT}
            y1={y}
            x2={WIDTH - PADDING_RIGHT}
            y2={y}
            stroke="rgba(255, 255, 255, 0.08)"
            stroke-dasharray={tick === 50 ? 'none' : '3,3'}
            stroke-width="1"
          />
          <text
            x={PADDING_LEFT - 6}
            y={y}
            fill="var(--tx-faint, #64748b)"
            font-size="9"
            font-weight="600"
            text-anchor="end"
            dominant-baseline="middle"
          >
            {tick}%
          </text>
        {/each}

        <!-- X-Axis Base Line -->
        <line
          x1={PADDING_LEFT}
          y1={HEIGHT - PADDING_BOTTOM}
          x2={WIDTH - PADDING_RIGHT}
          y2={HEIGHT - PADDING_BOTTOM}
          stroke="rgba(255, 255, 255, 0.15)"
          stroke-width="1"
        />

        <!-- X-Axis Match Labels -->
        {#each points as pt, i}
          {@const x = getX(i + 1, points.length)}
          {#if points.length <= 10 || i % Math.ceil(points.length / 8) === 0 || i === points.length - 1}
            <text
              x={x}
              y={HEIGHT - PADDING_BOTTOM + 14}
              fill="var(--tx-faint, #64748b)"
              font-size="8"
              font-weight="600"
              text-anchor="middle"
            >
              M{i + 1}
            </text>
          {/if}
        {/each}

        <!-- Trend Lines for Active Players -->
        {#each activePlayers as p}
          {@const color = p.avatarColor || '#b6ff2e'}
          <path
            d={getPlayerPath(p.id)}
            fill="none"
            stroke={color}
            stroke-width={selectedPlayerId === p.id ? '3.5' : '2'}
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity={selectedPlayerId === 'all' ? '0.85' : '1'}
          />

          <!-- Dots for each match -->
          {#each points as pt, i}
            {@const rate = pt.rates[p.id] ?? 0}
            {@const cx = getX(i + 1, points.length)}
            {@const cy = getY(rate)}
            <circle
              {cx}
              {cy}
              r={selectedPlayerId === p.id ? '4' : '2.5'}
              fill={color}
              stroke="#0f172a"
              stroke-width="1"
              role="button"
              tabindex="-1"
              aria-label="{p.name} Match #{i + 1}: {rate}%"
              class="cursor-pointer transition-transform hover:scale-125"
              onmouseenter={() => (hoveredPoint = { player: p, matchIdx: i + 1, rate, x: cx, y: cy })}
              onmouseleave={() => (hoveredPoint = null)}
            />
          {/each}
        {/each}
      </svg>

      <!-- Tooltip -->
      {#if hoveredPoint}
        <div
          class="absolute z-20 glass rounded-lg px-2 py-1 text-[10px] font-bold shadow-lg border border-white/20 pointer-events-none -translate-x-1/2 -translate-y-full mb-2"
          style="left:{hoveredPoint.x}px; top:{hoveredPoint.y}px;"
        >
          <span style="color:{hoveredPoint.player.avatarColor}">{hoveredPoint.player.name}</span>
          <span class="tx-faint"> · Match #{hoveredPoint.matchIdx}:</span>
          <span class="neon-text font-extrabold">{hoveredPoint.rate}%</span>
        </div>
      {/if}
    </div>

    <!-- Players Legend Chips -->
    <div class="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/10">
      {#each $players as p}
        <button
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all glass {selectedPlayerId ===
          p.id
            ? 'ring-1 ring-white/40'
            : ''}"
          onclick={() => (selectedPlayerId = selectedPlayerId === p.id ? 'all' : p.id)}
        >
          <span class="w-2.5 h-2.5 rounded-full" style="background:{p.avatarColor}"></span>
          <span class="tx">{p.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
