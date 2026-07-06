<script>
  let { active = $bindable('leaderboard') } = $props();

  const tabs = [
    { id: 'leaderboard', icon: '🏆', label: 'Board' },
    { id: 'log', icon: '🎾', label: 'Log' },
    { id: 'americano', icon: '🔀', label: 'Mixer' },
    { id: 'badges', icon: '🎖', label: 'Badges' },
    { id: 'history', icon: '🕒', label: 'History' },
    { id: 'manage', icon: '⚙️', label: 'Data' },
  ];
</script>

<nav class="fixed bottom-0 inset-x-0 z-40 px-3 pt-2"
     style="padding-bottom:max(0.5rem, env(safe-area-inset-bottom));
            background:linear-gradient(180deg, transparent, var(--page-solid) 42%);">
  <div class="max-w-lg mx-auto grid grid-cols-6 gap-0.5 glass rounded-[22px] p-1.5">
    {#each tabs as t}
      {@const on = active === t.id}
      <button class="relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200"
              style={on
                ? 'background:linear-gradient(160deg,rgba(198,255,50,0.16),rgba(47,240,214,0.08));box-shadow:inset 0 0 0 1px rgba(198,255,50,0.3);'
                : ''}
              onclick={() => (active = t.id)}>
        <span class="text-xl transition-transform duration-200 {on ? 'scale-110 -translate-y-0.5' : ''}"
              style={on ? 'filter:drop-shadow(0 0 10px #c6ff32);' : 'opacity:0.5;'}>{t.icon}</span>
        <span class="text-[10px] font-bold tracking-wide h-display {on ? 'gradient-text' : 'tx-faint'}">{t.label}</span>
      </button>
    {/each}
  </div>
</nav>
