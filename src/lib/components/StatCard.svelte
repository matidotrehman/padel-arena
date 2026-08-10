<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let { label, value, suffix = '', icon = '', accent = '#10b981', animate = true } = $props();

  const display = tweened(0, { duration: 800, easing: cubicOut });
  $effect(() => {
    if (animate && typeof value === 'number') display.set(value);
  });
  const shown = $derived(
    animate && typeof value === 'number' ? Math.round($display) : value
  );
</script>

<div
  class="rounded-2xl px-3.5 py-3 flex items-center gap-2.5"
  style="background:var(--surface-1);border:1px solid var(--border);"
>
  {#if icon}
    <div class="grid place-items-center w-8 h-8 rounded-lg text-base shrink-0"
         style="background:{accent}1a;color:{accent};">{icon}</div>
  {/if}
  <div class="min-w-0">
    <div class="mono text-[22px] font-extrabold leading-none tx">
      {shown}{suffix}
    </div>
    <div class="text-[10px] font-bold uppercase tracking-[0.14em] tx-faint mt-1 h-display truncate">
      {label}
    </div>
  </div>
</div>
