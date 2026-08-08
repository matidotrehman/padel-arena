<script>
  import PlayerRadar from './PlayerRadar.svelte';
  import DuoMatrixHeatmap from './DuoMatrixHeatmap.svelte';
  import FormTimelineChart from './FormTimelineChart.svelte';
  import ChemistryMatrix from './ChemistryMatrix.svelte';
  import HeadToHeadCompare from './HeadToHeadCompare.svelte';

  let subTab = $state('radar');

  const tabs = [
    { id: 'radar', label: 'Radar', icon: '🎯' },
    { id: 'matrix', label: 'Matrix', icon: '🧩' },
    { id: 'timeline', label: 'Timeline', icon: '📈' },
    { id: 'chemistry', label: 'Pairs', icon: '🧪' },
    { id: 'h2h', label: 'H2H', icon: '⚔️' },
  ];
</script>

<div class="space-y-4">
  <!-- Sub Navigation Bar -->
  <div class="glass rounded-2xl p-1 flex items-center justify-between gap-1 overflow-x-auto">
    {#each tabs as t}
      {@const active = subTab === t.id}
      <button
        class="flex-1 min-w-[62px] py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold transition-all whitespace-nowrap {active
          ? 'bg-emerald-500/20 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
          : 'tx-faint hover:tx'}"
        onclick={() => (subTab = t.id)}
      >
        <span class="text-sm">{t.icon}</span>
        <span>{t.label}</span>
      </button>
    {/each}
  </div>

  <!-- Sub Tab Views -->
  {#if subTab === 'radar'}
    <PlayerRadar />
  {:else if subTab === 'matrix'}
    <DuoMatrixHeatmap />
  {:else if subTab === 'timeline'}
    <FormTimelineChart />
  {:else if subTab === 'chemistry'}
    <ChemistryMatrix />
  {:else if subTab === 'h2h'}
    <HeadToHeadCompare />
  {/if}
</div>
