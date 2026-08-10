<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let { label, value, suffix = '', icon = null, animate = true } = $props();

  const display = tweened(0, { duration: 600, easing: cubicOut });
  $effect(() => {
    if (animate && typeof value === 'number') display.set(value);
  });
  const shown = $derived(
    animate && typeof value === 'number' ? Math.round($display) : value
  );
</script>

<div
  class="rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
  style="background:var(--surface-1);border:1px solid var(--border);"
>
  <div class="flex items-center gap-1.5 tx-faint">
    {#if icon}
      {@const Icon = icon}
      <Icon size={12} strokeWidth={2.25} />
    {/if}
    <span class="text-[10px] font-bold uppercase tracking-[0.12em] truncate">{label}</span>
  </div>
  <div class="mono text-[20px] font-bold leading-none tx">
    {shown}{suffix}
  </div>
</div>
