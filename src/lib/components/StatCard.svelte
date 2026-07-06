<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let { label, value, suffix = '', icon = '', accent = '#c6ff32', animate = true } = $props();

  const display = tweened(0, { duration: 800, easing: cubicOut });
  $effect(() => {
    if (animate && typeof value === 'number') display.set(value);
  });
  const shown = $derived(
    animate && typeof value === 'number' ? Math.round($display) : value
  );
</script>

<div
  class="card !p-3.5 flex flex-col gap-2 relative overflow-hidden"
  style="border-color:{accent}2a;"
>
  <div
    class="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-25"
    style="background:{accent};"
  ></div>
  {#if icon}
    <div class="grid place-items-center w-8 h-8 rounded-xl text-base"
         style="background:{accent}1a;border:1px solid {accent}33;">{icon}</div>
  {/if}
  <div>
    <div class="mono text-[26px] font-extrabold leading-none" style="color:{accent};">
      {shown}{suffix}
    </div>
    <div class="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mt-1.5 h-display">
      {label}
    </div>
  </div>
</div>
