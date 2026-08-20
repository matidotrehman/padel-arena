<script>
  import { fly } from 'svelte/transition';
  import { dateFilter, setMode, setCustomRange } from '../stores/dateFilter.js';

  const OPTIONS = [
    { mode: 'allTime', label: 'All Time' },
    { mode: 'thisMonth', label: 'This Month' },
    { mode: 'lastMonth', label: 'Last Month' },
    { mode: 'custom', label: 'Custom' },
  ];

  const activeIndex = $derived(Math.max(0, OPTIONS.findIndex((o) => o.mode === $dateFilter.mode)));

  let start = $state($dateFilter.customStart);
  let end = $state($dateFilter.customEnd);

  function apply() {
    if (start && end) setCustomRange(start, end);
  }
</script>

<div class="sticky top-0 z-30 -mx-4 px-4 pb-2 pt-1 mb-3" style="background:linear-gradient(180deg, var(--page-solid) 78%, transparent);">
  <div class="relative grid grid-cols-4 rounded-[var(--radius-sm)] p-1" style="background:var(--surface-1);border:1px solid var(--border);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
    <div class="absolute top-1 bottom-1 rounded-[var(--radius-sm)] pointer-events-none"
         style="width:calc((100% - 0.5rem) / 4);
                left:0.25rem;
                transform:translateX(calc({activeIndex} * 100%));
                background:var(--accent-bright);
                transition:transform 300ms var(--ease-spring);"></div>
    {#each OPTIONS as o}
      <button
        class="date-tab relative z-10 py-1.5 px-1 text-[11px] font-semibold rounded-[var(--radius-sm)] active:scale-[0.95] {$dateFilter.mode !== o.mode ? 'tx-muted' : ''}"
        style={$dateFilter.mode === o.mode ? 'color:var(--accent-on);' : ''}
        onclick={() => setMode(o.mode)}>{o.label}</button>
    {/each}
  </div>

  {#if $dateFilter.mode === 'custom'}
    <div class="rounded-[var(--radius-md)] p-2.5 mt-1.5 flex items-center gap-2" style="background:var(--surface-1);border:1px solid var(--border);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);" in:fly={{ y: -8, duration: 150 }}>
      <input type="date" class="input !py-1.5 text-sm flex-1" bind:value={start} onchange={apply} />
      <span class="tx-faint text-xs">to</span>
      <input type="date" class="input !py-1.5 text-sm flex-1" bind:value={end} onchange={apply} />
    </div>
  {/if}
</div>

<style>
  .date-tab {
    transition: color 150ms var(--ease-out-smooth), transform 150ms var(--ease-spring);
  }
  @media (hover: hover) {
    .date-tab:hover {
      color: var(--accent-fg);
    }
  }
</style>

