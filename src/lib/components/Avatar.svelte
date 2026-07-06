<script>
  let { player, size = 40 } = $props();
  const initials = $derived(
    (player?.name || '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  );
</script>

<div
  class="flex items-center justify-center rounded-full font-display font-bold shrink-0"
  style="
    width:{size}px;height:{size}px;font-size:{size * 0.38}px;
    color:{player?.avatarColor || '#b6ff2e'};
    background:radial-gradient(circle at 30% 30%, {player?.avatarColor || '#b6ff2e'}22, transparent 70%), #17171c;
    border:1.5px solid {player?.avatarColor || '#b6ff2e'}66;
    box-shadow:0 0 12px -4px {player?.avatarColor || '#b6ff2e'}88;
  "
>
  {initials}
</div>
