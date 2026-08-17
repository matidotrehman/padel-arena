<script>
  import { Award, Sparkles, Lock } from '@lucide/svelte';
  import { players } from '../stores/store.js';
  import { filteredMatches } from '../stores/analytics.js';
  import { computePlayerAchievements, ACHIEVEMENTS } from '../logic/achievements.js';
  import Avatar from './Avatar.svelte';

  let selectedPlayerId = $state('');

  $effect(() => {
    if (!selectedPlayerId && $players[0]) selectedPlayerId = $players[0].id;
  });

  const selectedPlayer = $derived($players.find((p) => p.id === selectedPlayerId));

  const stats = $derived(
    selectedPlayer
      ? computePlayerAchievements(selectedPlayer, $players, $filteredMatches)
      : null
  );
</script>

<div class="card space-y-4">
  <div class="flex items-center justify-between gap-2">
    <div>
      <h3 class="font-display font-bold neon-text text-base flex items-center gap-1.5">
        <Award size={16} strokeWidth={2.25} /> Personal Milestones &amp; Badges
      </h3>
      <p class="text-xs tx-muted">Unlockable career achievements for every friend</p>
    </div>

    <!-- Player Selector -->
    <select id="ach-player-select" class="input text-xs !py-1 !px-2 w-auto" bind:value={selectedPlayerId}>
      {#each $players as p}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select>
  </div>

  {#if selectedPlayer && stats}
    <!-- Player Header & Overall Progress -->
    <div class="glass rounded-[var(--radius-lg)] p-3 space-y-2" style="border-color:color-mix(in srgb, var(--accent-fg) 25%, transparent);">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <Avatar player={selectedPlayer} size={42} />
          <div>
            <h4 class="font-bold tx text-base leading-tight">{selectedPlayer.name}</h4>
            <span class="text-xs font-semibold neon-text">
              {stats.count} of {stats.total} Achievements Unlocked ({stats.pct}%)
            </span>
          </div>
        </div>
        <div class="mono font-extrabold text-2xl neon-text">{stats.pct}%</div>
      </div>

      <!-- Overall Progress Bar -->
      <div class="w-full h-2.5 rounded-full overflow-hidden p-0.5" style="background:var(--overlay-2);">
        <div
          class="h-full rounded-full"
          style="width:{stats.pct}%;background:linear-gradient(90deg, var(--grad-a), var(--grad-b));transition:width 500ms var(--ease-out-smooth);"
        ></div>
      </div>
    </div>

    <!-- Unlocked Achievements -->
    <div class="space-y-2">
      <h4 class="text-xs font-bold uppercase tracking-wider tx-faint flex items-center gap-1">
        <Sparkles size={13} strokeWidth={2.25} /> Unlocked ({stats.unlocked.length})
      </h4>

      {#if !stats.unlocked.length}
        <div class="glass rounded-[var(--radius-md)] p-4 text-center tx-faint text-xs">
          <div class="flex justify-center mb-2"><Sparkles size={24} strokeWidth={1.75} /></div>
          <p class="italic">No achievements unlocked yet. Keep playing matches to earn badges!</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {#each stats.unlocked as ach (ach.id)}
            <div
              class="glass rounded-[var(--radius-md)] p-3 flex items-start gap-2.5"
              style="border-color:color-mix(in srgb, var(--accent-fg) 30%, transparent);background:color-mix(in srgb, var(--accent-fg) 6%, var(--surface-1));"
            >
              <span
                class="shrink-0 p-1.5 rounded-[var(--radius-sm)] grid place-items-center"
                style="background:color-mix(in srgb, var(--accent-fg) 12%, transparent);border:1px solid color-mix(in srgb, var(--accent-fg) 20%, transparent);color:var(--accent-fg);"
              >
                <ach.icon size={20} strokeWidth={2} />
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                  <h5 class="text-xs font-bold neon-text truncate">{ach.title}</h5>
                  <span
                    class="text-[10px] mono font-bold px-1.5 py-0.5 rounded-full shrink-0"
                    style="color:var(--accent-fg);background:color-mix(in srgb, var(--accent-fg) 18%, transparent);"
                  >
                    Unlocked &check;
                  </span>
                </div>
                <p class="text-[11px] tx-muted leading-tight mt-0.5">{ach.description}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Locked / In Progress Achievements -->
    {#if stats.locked.length}
      <div class="space-y-2 pt-1 border-t" style="border-color:var(--border);">
        <h4 class="text-xs font-bold uppercase tracking-wider tx-faint flex items-center gap-1">
          <Lock size={13} strokeWidth={2.25} /> In Progress ({stats.locked.length})
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {#each stats.locked as ach (ach.id)}
            <div class="glass rounded-[var(--radius-md)] p-3 flex items-start gap-2.5 opacity-70 hover:opacity-100 transition-opacity">
              <span class="shrink-0 p-1.5 rounded-[var(--radius-sm)] grayscale grid place-items-center tx-faint" style="background:var(--overlay-1);">
                <ach.icon size={20} strokeWidth={2} />
              </span>
              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex items-center justify-between gap-1">
                  <h5 class="text-xs font-bold tx truncate">{ach.title}</h5>
                  <span class="text-[10px] mono font-bold tx-faint shrink-0">
                    {ach.label}
                  </span>
                </div>
                <p class="text-[11px] tx-muted leading-tight">{ach.description}</p>
                <!-- Individual Progress Bar -->
                <div class="w-full h-1.5 rounded-full overflow-hidden" style="background:var(--overlay-2);">
                  <div
                    class="h-full rounded-full"
                    style="width:{Math.round(ach.progress * 100)}%;background:color-mix(in srgb, var(--accent-fg) 60%, transparent);transition:width 500ms var(--ease-out-smooth);"
                  ></div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
