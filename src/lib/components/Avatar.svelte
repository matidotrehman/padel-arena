<script>
  let { player, size = 40 } = $props();

  const DEFAULT_ANIMALS = ['🦁', '🦅', '🐺', '🐆', '🦈', '🦍', '🐉', '🦊', '🐍', '🐂', '⚡', '👑'];

  function getDefaultAnimal(p) {
    if (!p) return '🦁';
    const str = p.id || p.name || 'x';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return DEFAULT_ANIMALS[Math.abs(hash) % DEFAULT_ANIMALS.length];
  }

  const initials = $derived(
    (player?.name || '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  );

  const icon = $derived(player?.avatarIcon || getDefaultAnimal(player));
</script>

<div
  class="flex items-center justify-center rounded-full font-display font-bold shrink-0 relative select-none"
  style="
    width:{size}px;height:{size}px;
    font-size:{icon ? size * 0.52 : size * 0.38}px;
    color:{player?.avatarColor || '#b6ff2e'};
    background:radial-gradient(circle at 35% 35%, {player?.avatarColor || '#b6ff2e'}28, transparent 72%), #13151b;
    border:1.5px solid {player?.avatarColor || '#b6ff2e'}77;
    box-shadow:0 0 14px -3px {player?.avatarColor || '#b6ff2e'}99;
  "
>
  {#if icon}
    <span class="leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{icon}</span>
  {:else}
    <span>{initials}</span>
  {/if}
</div>
