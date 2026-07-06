<script>
  import Avatar from './Avatar.svelte';
  let { badge } = $props();
  let flipped = $state(false);
</script>

<button
  class="relative w-full aspect-[4/5] [perspective:1000px] text-left"
  onclick={() => (flipped = !flipped)}
  aria-label="{badge.title} — tap to flip"
>
  <div
    class="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]"
    style="transform: rotateY({flipped ? 180 : 0}deg);"
  >
    <!-- Front -->
    <div
      class="absolute inset-0 card flex flex-col items-center justify-center text-center gap-2 [backface-visibility:hidden]"
      style="border-color:{badge.accent}44; box-shadow:0 0 30px -14px {badge.accent};"
    >
      <div class="text-4xl" style="filter:drop-shadow(0 0 10px {badge.accent}aa);">{badge.icon}</div>
      <div class="font-display font-bold text-sm leading-tight" style="color:{badge.accent};">
        {badge.title}
      </div>
      {#if badge.winner}
        <Avatar player={badge.winner} size={38} />
        <div class="text-xs font-semibold text-white/80 truncate max-w-full px-1">{badge.winner.name}</div>
        <div class="chip" style="background:{badge.accent}1a;color:{badge.accent};">{badge.value}</div>
      {:else}
        <div class="text-xs text-white/40">Up for grabs</div>
      {/if}
    </div>

    <!-- Back -->
    <div
      class="absolute inset-0 card flex flex-col items-center justify-center text-center gap-3 [backface-visibility:hidden]"
      style="transform: rotateY(180deg); border-color:{badge.accent}44;"
    >
      <div class="text-2xl">{badge.icon}</div>
      <p class="text-sm text-white/70 px-2 leading-snug">{badge.blurb}</p>
      <div class="text-[10px] uppercase tracking-widest text-white/30">tap to flip back</div>
    </div>
  </div>
</button>
