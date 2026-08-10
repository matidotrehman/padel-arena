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

  const icon = $derived(player?.avatarIcon || null);
</script>

<div
  class="flex items-center justify-center rounded-full font-bold shrink-0 relative select-none"
  style="
    width:{size}px;height:{size}px;
    font-size:{icon ? size * 0.5 : size * 0.36}px;
    color:{player?.avatarColor || 'var(--tx-muted)'};
    background:var(--page-solid);
    border:1px solid var(--border);
  "
>
  {#if icon}
    <span class="leading-none">{icon}</span>
  {:else}
    <span>{initials}</span>
  {/if}
</div>
