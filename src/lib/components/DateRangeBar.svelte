<script>
  import { fly } from 'svelte/transition';
  import { dateFilter, setMode, setCustomRange } from '../stores/dateFilter.js';

  const OPTIONS = [
    { mode: 'thisMonth', label: 'This Month' },
    { mode: 'lastMonth', label: 'Last Month' },
    { mode: 'allTime', label: 'All Time' },
    { mode: 'custom', label: 'Custom' },
  ];

  let start = $state($dateFilter.customStart);
  let end = $state($dateFilter.customEnd);

  function apply() {
    if (start && end) setCustomRange(start, end);
  }
</script>

<div class="sticky top-0 z-30 -mx-4 px-4 pb-2 pt-1 mb-3" style="background:linear-gradient(180deg, var(--page-solid) 72%, transparent);">
  <div class="glass rounded-2xl p-1 grid grid-cols-4 gap-1">
    {#each OPTIONS as o}
      <button
        class="btn !py-2 !px-1 text-[11px] {$dateFilter.mode === o.mode ? 'btn-primary' : 'tx-muted'}"
        onclick={() => setMode(o.mode)}>{o.label}</button>
    {/each}
  </div>

  {#if $dateFilter.mode === 'custom'}
    <div class="glass rounded-2xl p-2.5 mt-1.5 flex items-center gap-2" in:fly={{ y: -8, duration: 150 }}>
      <input type="date" class="input !py-1.5 text-sm flex-1" bind:value={start} onchange={apply} />
      <span class="tx-faint text-xs">to</span>
      <input type="date" class="input !py-1.5 text-sm flex-1" bind:value={end} onchange={apply} />
    </div>
  {/if}
</div>
