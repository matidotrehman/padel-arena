<script>
  import { LayoutGrid, CirclePlus, Shuffle, Award, FlaskConical, Clock, Database } from '@lucide/svelte';

  let { active = $bindable('leaderboard') } = $props();

  const tabs = [
    { id: 'leaderboard', icon: LayoutGrid, label: 'Board' },
    { id: 'log', icon: CirclePlus, label: 'Log' },
    { id: 'americano', icon: Shuffle, label: 'Mixer' },
    { id: 'badges', icon: Award, label: 'Badges' },
    { id: 'chemistry', icon: FlaskConical, label: 'Chem' },
    { id: 'history', icon: Clock, label: 'History' },
    { id: 'manage', icon: Database, label: 'Data' },
  ];
</script>

<nav class="fixed bottom-0 inset-x-0 z-40 px-3 pt-2"
     style="padding-bottom:max(0.5rem, env(safe-area-inset-bottom));
            background:linear-gradient(180deg, transparent, var(--page-solid) 55%);">
  <div class="max-w-lg mx-auto relative grid grid-cols-7 gap-0.5 rounded-xl p-1.5"
       style="background:var(--surface-1);border:1px solid var(--border);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);">
    {#each tabs as t}
      {@const on = active === t.id}
      {@const Icon = t.icon}
      <button class="relative flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors duration-150"
              onclick={() => (active = t.id)}
              style={on ? 'color:var(--accent-fg);' : 'color:var(--tx-faint);'}>
        <Icon size={18} strokeWidth={2} />
        <span class="text-[9px] font-semibold tracking-wide truncate max-w-full">{t.label}</span>
      </button>
    {/each}
  </div>
</nav>
