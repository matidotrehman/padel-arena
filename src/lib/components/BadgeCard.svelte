<script>
  import Avatar from './Avatar.svelte';
  let { badge, hero = false } = $props();
  const Icon = $derived(badge.icon);
</script>

<!-- Static card — all info shown at once (no flip, so nothing can overlap). -->
{#if hero}
  <div
    class="badge-card card h-full flex items-center gap-4 relative overflow-hidden rounded-[var(--radius-md)]"
    style="--acc:{badge.accent}; border-color:color-mix(in srgb, var(--acc) 35%, transparent); box-shadow:0 0 30px -16px var(--acc);"
  >
    <div class="absolute -right-8 -top-10 w-28 h-28 rounded-full blur-3xl opacity-30" style="background:{badge.accent};"></div>
    <div class="shrink-0 relative z-10" style="filter:drop-shadow(0 0 10px color-mix(in srgb, var(--acc) 65%, transparent));">
      <Icon size={40} strokeWidth={2} color={badge.accent} />
    </div>
    <div class="min-w-0 flex-1 relative z-10">
      <div class="font-display font-bold text-base leading-tight accent-el" style="color:{badge.accent};">{badge.title}</div>
      <p class="text-[11px] tx-faint leading-snug mt-0.5">{badge.blurb}</p>
      {#if badge.winner}
        <div class="flex items-center gap-2 mt-2">
          <Avatar player={badge.winner} size={30} />
          <span class="text-sm font-semibold tx truncate">{badge.winner.name}</span>
          <span class="chip accent-el ml-auto mono" style="background:{badge.accent}22;color:{badge.accent};">{badge.value}</span>
        </div>
      {:else}
        <div class="chip tx-faint mt-2" style="background:color-mix(in srgb, var(--tx) 7%, transparent);">Up for grabs</div>
      {/if}
    </div>
  </div>
{:else}
  <div
    class="badge-card card h-full min-h-[188px] flex flex-col items-center text-center gap-2 rounded-[var(--radius-md)]"
    style="--acc:{badge.accent}; border-color:color-mix(in srgb, var(--acc) 35%, transparent); box-shadow:0 0 30px -16px var(--acc);"
  >
    <div style="filter:drop-shadow(0 0 10px color-mix(in srgb, var(--acc) 65%, transparent));">
      <Icon size={32} strokeWidth={2} color={badge.accent} />
    </div>
    <div class="font-display font-bold text-sm leading-tight accent-el" style="color:{badge.accent};">
      {badge.title}
    </div>
    <p class="text-[11px] tx-faint leading-snug px-1">{badge.blurb}</p>

    <div class="mt-auto pt-1 flex flex-col items-center gap-1.5 w-full">
      {#if badge.winner}
        <Avatar player={badge.winner} size={36} />
        <div class="text-xs font-semibold tx truncate max-w-full px-1">{badge.winner.name}</div>
        <div class="chip accent-el mono" style="background:{badge.accent}22;color:{badge.accent};">{badge.value}</div>
      {:else}
        <div class="chip tx-faint" style="background:color-mix(in srgb, var(--tx) 7%, transparent);">Up for grabs</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .badge-card {
    transition:
      transform 220ms var(--ease-spring),
      box-shadow 220ms var(--ease-out-smooth),
      border-color 220ms var(--ease-out-smooth);
  }
  .badge-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 34px -14px color-mix(in srgb, var(--acc) 55%, transparent);
    border-color: color-mix(in srgb, var(--acc) 70%, transparent);
  }
  .badge-card:active {
    transform: translateY(-1px) scale(0.98);
  }
</style>
