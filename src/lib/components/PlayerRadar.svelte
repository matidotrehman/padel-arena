<script>
  import { players } from '../stores/store.js';
  import { filteredMatches } from '../stores/analytics.js';
  import { computeRadarMetrics } from '../logic/analyticsEngine.js';
  import Avatar from './Avatar.svelte';

  let player1Id = $state('');
  let player2Id = $state('');

  $effect(() => {
    if (!player1Id && $players[0]) player1Id = $players[0].id;
  });

  const player1 = $derived($players.find((p) => p.id === player1Id));
  const player2 = $derived($players.find((p) => p.id === player2Id));

  const metrics1 = $derived(player1 ? computeRadarMetrics(player1, $filteredMatches) : null);
  const metrics2 = $derived(player2 ? computeRadarMetrics(player2, $filteredMatches) : null);

  const axes = [
    { key: 'power', label: 'Power (Win %)' },
    { key: 'dominance', label: 'Dominance' },
    { key: 'form', label: 'Form (Last 5)' },
    { key: 'clutch', label: 'Clutch' },
    { key: 'versatility', label: 'Versatility' },
  ];

  const CX = 140;
  const CY = 140;
  const RADIUS = 95;
  const NUM_AXES = 5;

  function getCoordinates(index, value) {
    const angle = (index * 2 * Math.PI) / NUM_AXES - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * RADIUS;
    return {
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    };
  }

  function getPolygonPath(metrics) {
    if (!metrics) return '';
    return axes
      .map((ax, idx) => {
        const val = metrics[ax.key] ?? 50;
        const { x, y } = getCoordinates(idx, val);
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';
  }

  const gridCircles = [0.25, 0.5, 0.75, 1.0];
</script>

<div class="card space-y-4">
  <div class="flex items-center justify-between gap-2">
    <div>
      <h3 class="font-display font-bold neon-text text-base flex items-center gap-1.5">
        <span>🎯</span> Player Radar Attributes
      </h3>
      <p class="text-xs tx-muted">5-axis skill breakdown &amp; dual-player comparison</p>
    </div>
  </div>

  <!-- Player Selectors -->
  <div class="grid grid-cols-2 gap-2">
    <div>
      <label class="label !mb-1 text-[11px]" for="radar-p1-select">Primary Player</label>
      <select id="radar-p1-select" class="input text-xs !py-1.5" bind:value={player1Id}>
        {#each $players as p}
          <option value={p.id} disabled={p.id === player2Id}>{p.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class="label !mb-1 text-[11px]" for="radar-p2-select">Compare (Optional)</label>
      <select id="radar-p2-select" class="input text-xs !py-1.5" bind:value={player2Id}>
        <option value="">None</option>
        {#each $players as p}
          <option value={p.id} disabled={p.id === player1Id}>{p.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- SVG Radar Chart -->
  <div class="relative flex flex-col items-center justify-center pt-2 pb-1">
    <svg width="280" height="280" viewBox="0 0 280 280" class="overflow-visible select-none">
      <defs>
        <!-- Glow Filter for Player 1 -->
        <filter id="radar-glow-p1" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="p1-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--accent-fg)" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#22e0c8" stop-opacity="0.25" />
        </linearGradient>
      </defs>

      <!-- Background Grid Web -->
      {#each gridCircles as pct}
        <polygon
          points={axes.map((_, i) => {
            const { x, y } = getCoordinates(i, pct * 100);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          stroke-width="1"
          stroke-dasharray={pct === 1 ? 'none' : '2,2'}
        />
      {/each}

      <!-- Axis Spokes -->
      {#each axes as ax, idx}
        {@const outer = getCoordinates(idx, 100)}
        <line
          x1={CX}
          y1={CY}
          x2={outer.x}
          y2={outer.y}
          stroke="rgba(255, 255, 255, 0.12)"
          stroke-width="1"
        />
        <!-- Axis Labels -->
        {@const labelPos = getCoordinates(idx, 118)}
        <text
          x={labelPos.x}
          y={labelPos.y}
          fill="var(--tx-muted, #94a3b8)"
          font-size="10"
          font-weight="600"
          font-family="system-ui"
          text-anchor={Math.abs(labelPos.x - CX) < 10 ? 'middle' : labelPos.x > CX ? 'start' : 'end'}
          dominant-baseline={Math.abs(labelPos.y - CY) < 10 ? 'middle' : labelPos.y > CY ? 'hanging' : 'auto'}
        >
          {ax.label}
        </text>
      {/each}

      <!-- Player 2 Radar Polygon (Compare) -->
      {#if metrics2}
        <path
          d={getPolygonPath(metrics2)}
          fill="rgba(56, 189, 248, 0.2)"
          stroke="#38bdf8"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
        {#each axes as ax, idx}
          {@const pt = getCoordinates(idx, metrics2[ax.key] ?? 50)}
          <circle cx={pt.x} cy={pt.y} r="3.5" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" />
        {/each}
      {/if}

      <!-- Player 1 Radar Polygon (Primary) -->
      {#if metrics1}
        <path
          d={getPolygonPath(metrics1)}
          fill="url(#p1-grad)"
          stroke="var(--accent-fg)"
          stroke-width="2.5"
          stroke-linejoin="round"
          filter="url(#radar-glow-p1)"
        />
        {#each axes as ax, idx}
          {@const pt = getCoordinates(idx, metrics1[ax.key] ?? 50)}
          <circle
            cx={pt.x}
            cy={pt.y}
            r="4"
            fill="var(--accent-fg)"
            stroke="#0f172a"
            stroke-width="1.5"
          />
        {/each}
      {/if}
    </svg>
  </div>

  <!-- Legend & Value Breakdown -->
  <div class="space-y-2 pt-2 border-t border-white/10">
    <div class="grid grid-cols-5 gap-1.5 text-center">
      {#each axes as ax}
        <div class="glass rounded-lg p-1.5 flex flex-col items-center">
          <span class="text-[9px] tx-faint font-bold uppercase truncate max-w-full">{ax.key}</span>
          <div class="flex items-center gap-1 mt-0.5">
            {#if metrics1}
              <span class="mono text-xs font-extrabold neon-text">{metrics1[ax.key]}</span>
            {/if}
            {#if metrics2}
              <span class="text-[10px] tx-faint">/</span>
              <span class="mono text-xs font-bold text-sky-400">{metrics2[ax.key]}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Players Legend -->
    <div class="flex items-center justify-center gap-4 text-xs font-medium pt-1">
      {#if player1}
        <div class="flex items-center gap-1.5">
          <Avatar player={player1} size={18} />
          <span class="neon-text font-bold">{player1.name}</span>
        </div>
      {/if}
      {#if player2}
        <div class="flex items-center gap-1.5">
          <Avatar player={player2} size={18} />
          <span class="text-sky-400 font-bold">{player2.name}</span>
        </div>
      {/if}
    </div>
  </div>
</div>
