<script>
  import Avatar from './Avatar.svelte';
  let { badge, hero = false } = $props();
</script>

<!-- Static card — all info shown at once (no flip, so nothing can overlap). -->
{#if hero}
  <div class="card h-full flex items-center gap-4 relative overflow-hidden"
       style="border-color:{badge.accent}55; box-shadow:0 0 30px -16px {badge.accent};">
    <div class="absolute -right-8 -top-10 w-28 h-28 rounded-full blur-3xl opacity-30" style="background:{badge.accent};"></div>
    <div class="text-5xl shrink-0 relative z-10" style="filter:drop-shadow(0 0 10px {badge.accent}aa);">{badge.icon}</div>
    <div class="min-w-0 flex-1 relative z-10">
      <div class="font-display font-bold text-base leading-tight accent-el" style="color:{badge.accent};">{badge.title}</div>
      <p class="text-[11px] tx-faint leading-snug mt-0.5">{badge.blurb}</p>
      {#if badge.winner}
        <div class="flex items-center gap-2 mt-2">
          <Avatar player={badge.winner} size={30} />
          <span class="text-sm font-semibold tx truncate">{badge.winner.name}</span>
          <span class="chip accent-el ml-auto" style="background:{badge.accent}22;color:{badge.accent};">{badge.value}</span>
        </div>
      {:else}
        <div class="chip tx-faint mt-2" style="background:color-mix(in srgb, var(--tx) 7%, transparent);">Up for grabs</div>
      {/if}
    </div>
  </div>
{:else}
  <div
    class="card h-full min-h-[188px] flex flex-col items-center text-center gap-2"
    style="border-color:{badge.accent}55; box-shadow:0 0 30px -16px {badge.accent};"
  >
    <div class="text-4xl" style="filter:drop-shadow(0 0 10px {badge.accent}aa);">{badge.icon}</div>
    <div class="font-display font-bold text-sm leading-tight accent-el" style="color:{badge.accent};">
      {badge.title}
    </div>
    <p class="text-[11px] tx-faint leading-snug px-1">{badge.blurb}</p>

    <div class="mt-auto pt-1 flex flex-col items-center gap-1.5 w-full">
      {#if badge.winner}
        <Avatar player={badge.winner} size={36} />
        <div class="text-xs font-semibold tx truncate max-w-full px-1">{badge.winner.name}</div>
        <div class="chip accent-el" style="background:{badge.accent}22;color:{badge.accent};">{badge.value}</div>
      {:else}
        <div class="chip tx-faint" style="background:color-mix(in srgb, var(--tx) 7%, transparent);">Up for grabs</div>
      {/if}
    </div>
  </div>
{/if}
