<script>
  import { Trophy } from '@lucide/svelte';
  import { NAV_TABS } from '../nav.js';

  let { active = $bindable('leaderboard') } = $props();
</script>

<aside class="hidden lg:flex lg:flex-col lg:w-[248px] lg:shrink-0 rounded-[var(--radius-lg)] p-4 gap-6"
       style="background:var(--surface-1);border:1px solid var(--border);box-shadow:var(--shadow-card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
  <div class="flex items-center gap-2 px-1">
    <span class="grid place-items-center w-9 h-9 rounded-[var(--radius-sm)] shrink-0"
          style="background:var(--surface-2);border:1px solid var(--border);color:var(--accent-fg);">
      <Trophy size={18} strokeWidth={2.25} />
    </span>
    <h1 class="h-display font-extrabold text-[22px] leading-none tracking-tight">
      <span class="tx">Padel</span><span style="color:var(--accent-fg);">6</span>
    </h1>
  </div>

  <nav class="flex flex-col gap-1">
    {#each NAV_TABS as t}
      {@const on = active === t.id}
      {@const Icon = t.icon}
      <button
        type="button"
        class="sidebar-btn flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[13px] font-semibold text-left active:scale-[0.98]"
        onclick={() => (active = t.id)}
        style="
          background:{on ? 'color-mix(in srgb, var(--accent-fg) 14%, transparent)' : 'transparent'};
          color:{on ? 'var(--accent-fg)' : 'var(--tx-muted)'};
        ">
        <Icon size={18} strokeWidth={2.25} />
        {t.label}
      </button>
    {/each}
  </nav>

  <div class="mt-auto text-[10px] tx-faint uppercase tracking-[0.14em] font-semibold px-1">Padel6 · Friends League</div>
</aside>

<style>
  .sidebar-btn {
    transition: background-color 150ms var(--ease-out-smooth), color 150ms var(--ease-out-smooth), transform 150ms var(--ease-spring);
  }
  @media (hover: hover) {
    .sidebar-btn:hover {
      background: var(--overlay-1);
      color: var(--accent-fg);
    }
  }
</style>
