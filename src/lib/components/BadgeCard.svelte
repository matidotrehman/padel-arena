<script>
  import Avatar from './Avatar.svelte';
  let { badge } = $props();
  let flipped = $state(false);
  let elevated = $state(false); // keep the card above its neighbours while it flips
  let timer;

  function toggle() {
    flipped = !flipped;
    elevated = true;
    clearTimeout(timer);
    // once the 3D rotation finishes, only stay raised if we're showing the back
    timer = setTimeout(() => (elevated = flipped), 520);
  }
</script>

<button
  class="relative w-full h-[178px] [perspective:1000px] text-left"
  style="z-index:{elevated ? 30 : 1}"
  onclick={toggle}
  aria-label="{badge.title} — tap to flip"
>
  <div
    class="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]"
    style="transform: rotateY({flipped ? 180 : 0}deg);"
  >
    <!-- Front -->
    <div
      class="absolute inset-0 card flex flex-col items-center justify-center text-center gap-2 [backface-visibility:hidden]"
      style="border-color:{badge.accent}55; box-shadow:0 0 30px -16px {badge.accent};"
    >
      <div class="text-4xl" style="filter:drop-shadow(0 0 10px {badge.accent}aa);">{badge.icon}</div>
      <div class="font-display font-bold text-sm leading-tight accent-el" style="color:{badge.accent};">
        {badge.title}
      </div>
      {#if badge.winner}
        <Avatar player={badge.winner} size={38} />
        <div class="text-xs font-semibold tx truncate max-w-full px-1">{badge.winner.name}</div>
        <div class="chip accent-el" style="background:{badge.accent}22;color:{badge.accent};">{badge.value}</div>
      {:else}
        <div class="text-xs tx-faint">Up for grabs</div>
      {/if}
    </div>

    <!-- Back -->
    <div
      class="absolute inset-0 card flex flex-col items-center justify-center text-center gap-3 [backface-visibility:hidden]"
      style="transform: rotateY(180deg); border-color:{badge.accent}55;"
    >
      <div class="text-2xl">{badge.icon}</div>
      <p class="text-sm tx-muted px-3 leading-snug">{badge.blurb}</p>
      <div class="text-[10px] uppercase tracking-widest tx-faint">tap to flip back</div>
    </div>
  </div>
</button>
