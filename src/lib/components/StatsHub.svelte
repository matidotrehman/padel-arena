<script>
  import { Award, LineChart } from '@lucide/svelte';
  import BadgesPanel from './BadgesPanel.svelte';
  import AnalyticsHub from './AnalyticsHub.svelte';

  let section = $state('badges'); // 'badges' | 'analytics'

  const sections = [
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
  ];
</script>

<div class="space-y-4">
  <div class="relative grid grid-cols-2 rounded-[var(--radius-sm)] p-1" style="background:var(--surface-1);border:1px solid var(--border);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
    <div class="absolute top-1 bottom-1 rounded-[var(--radius-sm)] pointer-events-none"
         style="width:calc(50% - 0.25rem);
                left:0.25rem;
                transform:translateX({section === 'analytics' ? '100%' : '0'});
                background:var(--accent-bright);
                transition:transform 300ms var(--ease-spring);"></div>
    {#each sections as s}
      {@const Icon = s.icon}
      {@const on = section === s.id}
      <button
        class="section-tab relative z-10 py-1.5 px-1 text-[12px] font-semibold rounded-[var(--radius-sm)] flex items-center justify-center gap-1.5 active:scale-[0.95] {on ? '' : 'tx-muted'}"
        style={on ? 'color:var(--accent-on);' : ''}
        onclick={() => (section = s.id)}>
        <Icon size={14} strokeWidth={2.25} />
        {s.label}
      </button>
    {/each}
  </div>

  {#if section === 'badges'}
    <BadgesPanel />
  {:else}
    <AnalyticsHub />
  {/if}
</div>

<style>
  .section-tab {
    transition: color 150ms var(--ease-out-smooth), transform 150ms var(--ease-spring);
  }
  @media (hover: hover) {
    .section-tab:hover {
      color: var(--accent-fg);
    }
  }
</style>
