<script>
  let { active = $bindable('leaderboard') } = $props();

  const tabs = [
    { id: 'leaderboard', icon: '🏆', label: 'Board' },
    { id: 'log', icon: '🎾', label: 'Log' },
    { id: 'americano', icon: '🔀', label: 'Mixer' },
    { id: 'badges', icon: '🎖', label: 'Badges' },
    { id: 'chemistry', icon: '🧬', label: 'Chem' },
    { id: 'history', icon: '🕒', label: 'History' },
    { id: 'manage', icon: '⚙️', label: 'Data' },
  ];

  const activeIndex = $derived(Math.max(0, tabs.findIndex((t) => t.id === active)));
</script>

<nav class="fixed bottom-0 inset-x-0 z-40 px-3 pt-2"
     style="padding-bottom:max(0.5rem, env(safe-area-inset-bottom));
            background:linear-gradient(180deg, transparent, var(--page-solid) 42%);">
  <div class="max-w-lg mx-auto relative grid grid-cols-7 gap-0.5 glass rounded-[22px] p-1.5">
    <div class="absolute top-1.5 bottom-1.5 rounded-2xl transition-transform duration-300 ease-out pointer-events-none"
         style="width:calc((100% - 0.75rem) / 7);
                left:0.375rem;
                transform:translateX(calc({activeIndex} * 100%));
                background:linear-gradient(160deg,color-mix(in srgb, var(--color-neon-green) 16%, transparent),rgba(47,240,214,0.08));
                box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--color-neon-green) 30%, transparent);"></div>
    {#each tabs as t}
      {@const on = active === t.id}
      <button class="relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200"
              onclick={() => (active = t.id)}>
        <span class="text-xl transition-transform duration-200 {on ? 'scale-110 -translate-y-0.5' : ''}"
              style={on ? 'filter:drop-shadow(0 0 10px var(--color-neon-green));' : 'opacity:0.5;'}>{t.icon}</span>
        <span class="text-[10px] font-bold tracking-wide h-display truncate max-w-full {on ? 'gradient-text' : 'tx-faint'}">{t.label}</span>
      </button>
    {/each}
  </div>
</nav>
