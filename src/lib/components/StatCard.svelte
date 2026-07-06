<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let { label, value, suffix = '', icon = '', accent = '#b6ff2e', animate = true } = $props();

  const display = tweened(0, { duration: 700, easing: cubicOut });
  $effect(() => {
    if (animate && typeof value === 'number') display.set(value);
  });
  const shown = $derived(
    animate && typeof value === 'number' ? Math.round($display) : value
  );
</script>

<div
  class="card flex flex-col gap-1 relative overflow-hidden"
  style="border-color:{accent}22;"
>
  <div
    class="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl opacity-30"
    style="background:{accent};"
  ></div>
  <div class="flex items-center gap-1.5 text-white/50 text-xs font-semibold uppercase tracking-wider">
    {#if icon}<span>{icon}</span>{/if}{label}
  </div>
  <div class="font-display text-2xl font-bold" style="color:{accent};">
    {shown}{suffix}
  </div>
</div>
