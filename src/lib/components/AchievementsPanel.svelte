<script>
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
        <span>🎖️</span> Personal Milestones &amp; Badges
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
    <div class="glass rounded-2xl p-3 border border-emerald-500/25 space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <Avatar player={selectedPlayer} size={42} />
          <div>
            <h4 class="font-bold tx text-base leading-tight">{selectedPlayer.name}</h4>
            <span class="text-xs font-semibold text-emerald-400">
              {stats.count} of {stats.total} Achievements Unlocked ({stats.pct}%)
            </span>
          </div>
        </div>
        <div class="mono font-extrabold text-2xl neon-text">{stats.pct}%</div>
      </div>

      <!-- Overall Progress Bar -->
      <div class="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5">
        <div
          class="h-full rounded-full transition-all duration-500"
          style="width:{stats.pct}%;background:linear-gradient(90deg, var(--color-neon-green, #b6ff2e), #22e0c8);"
        ></div>
      </div>
    </div>

    <!-- Unlocked Achievements -->
    <div class="space-y-2">
      <h4 class="text-xs font-bold uppercase tracking-wider tx-faint flex items-center gap-1">
        <span>✨</span> Unlocked ({stats.unlocked.length})
      </h4>

      {#if !stats.unlocked.length}
        <div class="glass rounded-xl p-4 text-center tx-faint text-xs italic">
          No achievements unlocked yet. Keep playing matches to earn badges!
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {#each stats.unlocked as ach (ach.id)}
            <div class="glass rounded-xl p-3 flex items-start gap-2.5 border border-emerald-500/30 bg-emerald-500/5">
              <span class="text-2xl shrink-0 p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                {ach.icon}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                  <h5 class="text-xs font-bold neon-text truncate">{ach.title}</h5>
                  <span class="text-[10px] mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                    Unlocked ✓
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
      <div class="space-y-2 pt-1 border-t border-white/10">
        <h4 class="text-xs font-bold uppercase tracking-wider tx-faint flex items-center gap-1">
          <span>🔒</span> In Progress ({stats.locked.length})
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {#each stats.locked as ach (ach.id)}
            <div class="glass rounded-xl p-3 flex items-start gap-2.5 opacity-70 hover:opacity-100 transition-opacity">
              <span class="text-2xl shrink-0 p-1.5 rounded-xl bg-white/5 grayscale">
                {ach.icon}
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
                <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full bg-sky-400/60"
                    style="width:{Math.round(ach.progress * 100)}%;"
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
