<script>
  let { player, size = 40 } = $props();

  const DEFAULT_ICONS = ['🦁', '🦅', '🐺', '🐆', '🦈', '🦍', '🐉', '🦊', '🐍', '🐂', '⚡', '👑'];

  function getDefaultIcon(p) {
    if (!p) return '🦁';
    const str = p.id || p.name || 'x';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return DEFAULT_ICONS[Math.abs(hash) % DEFAULT_ICONS.length];
  }

  const color = $derived(player?.avatarColor || '#10B981');
  const icon = $derived(player?.avatarIcon || getDefaultIcon(player));
</script>

<div
  class="flex items-center justify-center rounded-full shrink-0 relative select-none"
  style="
    width:{size}px;height:{size}px;
    font-size:{size * 0.5}px;
    background:radial-gradient(circle at 35% 30%, {color}30, var(--surface-1) 72%);
    border:1.5px solid {color}80;
  "
>
  <span class="leading-none">{icon}</span>
</div>
