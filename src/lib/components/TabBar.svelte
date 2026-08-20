<script>
  import { NAV_TABS } from '../nav.js';

  let { active = $bindable('leaderboard') } = $props();

  const tabs = NAV_TABS;
</script>

<nav class="fixed bottom-0 inset-x-0 z-40 px-1 lg:hidden"
     style="padding-bottom:env(safe-area-inset-bottom);
            background:color-mix(in srgb, var(--page-solid) 82%, transparent);
            backdrop-filter:blur(12px);
            -webkit-backdrop-filter:blur(12px);
            border-top:1px solid var(--border);">
  <div class="max-w-lg mx-auto grid grid-cols-5 gap-0.5 py-1.5">
    {#each tabs as t}
      {@const on = active === t.id}
      {@const Icon = t.icon}
      <button class="tab-btn relative flex flex-col items-center gap-1 py-1.5 rounded-[var(--radius-sm)] active:scale-[0.94] {on ? '' : 'tab-btn--off'}"
              onclick={() => (active = t.id)}
              style="
                border:none;
                background:{on ? 'color-mix(in srgb, var(--accent-fg) 12%, transparent)' : 'transparent'};
                color:{on ? 'var(--accent-fg)' : 'var(--tx-faint)'};
              ">
        <Icon size={18} strokeWidth={2} />
        <span class="text-[9px] font-semibold tracking-wide truncate max-w-full">{t.label}</span>
      </button>
    {/each}
  </div>
</nav>

<style>
  .tab-btn {
    transition: background-color 150ms var(--ease-out-smooth), color 150ms var(--ease-out-smooth), transform 150ms var(--ease-spring);
  }
  @media (hover: hover) {
    .tab-btn--off:hover {
      background: color-mix(in srgb, var(--accent-fg) 7%, transparent) !important;
      color: var(--accent-fg) !important;
    }
  }
</style>
