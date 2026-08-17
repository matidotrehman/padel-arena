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
  class="rounded-[var(--radius-md)] px-3 py-2.5 flex flex-col gap-1.5"
  style="
    background:color-mix(in srgb, var(--surface-1) 82%, transparent);
    backdrop-filter:blur(8px);
    -webkit-backdrop-filter:blur(8px);
    border-left:1px solid var(--border);
    border-right:1px solid var(--border);
    border-bottom:1px solid var(--border);
    border-top:1px solid var(--border-hi);
    box-shadow:var(--shadow-card);
  "
>
  <div class="flex items-center gap-1.5 tx-faint">
    {#if icon}
      {@const Icon = icon}
      <Icon size={12} strokeWidth={2.5} color="var(--accent-fg)" />
    {/if}
    <span class="text-[10px] font-bold uppercase tracking-[0.12em] truncate">{label}</span>
  </div>
  <div class="mono text-[20px] font-bold leading-none tx">
    {shown}{suffix}
  </div>
</div>
