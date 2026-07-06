<script>
  let { active = $bindable('leaderboard') } = $props();

  const tabs = [
    { id: 'leaderboard', icon: '🏆', label: 'Board' },
    { id: 'log', icon: '🎾', label: 'Log' },
    { id: 'americano', icon: '🔀', label: 'Mixer' },
    { id: 'badges', icon: '🎖', label: 'Badges' },
    { id: 'manage', icon: '⚙️', label: 'Data' },
  ];
</script>

<nav class="fixed bottom-0 inset-x-0 z-40 glass border-t border-white/10 px-2 pt-1.5"
     style="padding-bottom:max(0.375rem, env(safe-area-inset-bottom));">
  <div class="max-w-lg mx-auto grid grid-cols-5 gap-1">
    {#each tabs as t}
      {@const on = active === t.id}
      <button class="flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition"
              onclick={() => (active = t.id)}>
        <span class="text-xl transition-transform {on ? 'scale-110' : ''}"
              style={on ? 'filter:drop-shadow(0 0 8px #b6ff2e);' : 'opacity:0.55;'}>{t.icon}</span>
        <span class="text-[10px] font-semibold tracking-wide {on ? 'neon-text' : 'text-white/40'}">{t.label}</span>
      </button>
    {/each}
  </div>
</nav>
