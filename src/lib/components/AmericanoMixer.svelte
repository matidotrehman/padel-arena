<script>
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { players, mergeAmericano } from '../stores/store.js';
  import { session, startSession, updateRoundScore, endSession } from '../stores/session.js';
  import { generateSchedule, suggestedRounds, sessionTotals } from '../logic/americano.js';
  import { celebrate } from '../logic/celebrate.js';
  import RoundCard from './RoundCard.svelte';
  import Avatar from './Avatar.svelte';

  // ---- Setup state ----
  let picked = $state(new Set());
  let minutes = $state(150);
  const rounds = $derived(suggestedRounds(minutes));
  const canStart = $derived(picked.size >= 4);
  const restPerRound = $derived(Math.max(0, picked.size - 4)); // single court: 4 play, rest sit

  // Pre-select everyone currently in the roster (they can deselect who's absent).
  $effect(() => {
    if (picked.size === 0 && !$session && $players.length) {
      picked = new Set($players.map((p) => p.id));
    }
  });

  function toggle(id) {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    picked = next;
  }

  function start() {
    if (!canStart) return;
    const ids = $players.filter((p) => picked.has(p.id)).map((p) => p.id);
    const { rounds: schedule } = generateSchedule(ids, rounds);
    startSession(ids, schedule);
  }

  // ---- Live session ----
  const playersById = $derived(Object.fromEntries($players.map((p) => [p.id, p])));
  const totals = $derived($session ? sessionTotals($session.rounds, $session.playerIds) : {});
  const leaderboard = $derived(
    $session
      ? [...$session.playerIds]
          .map((id) => ({ player: playersById[id], ...totals[id] }))
          .sort((a, b) => b.points - a.points || b.wins - a.wins)
      : []
  );
  const playedCount = $derived(
    $session ? $session.rounds.filter((r) => r.scoreA != null && r.scoreB != null).length : 0
  );
  const totalRounds = $derived($session ? $session.rounds.length : 0);
  // First not-yet-scored round → "Up next" on the courtside sheet.
  const nextIndex = $derived(
    $session ? $session.rounds.findIndex((r) => r.scoreA == null || r.scoreB == null) : -1
  );

  let merged = $state(false);
  let showFinalize = $state(false);

  function doMerge() {
    mergeAmericano($session.rounds);
    merged = true;
    celebrate();
  }

  function finishAndClose() {
    endSession();
    showFinalize = false;
    merged = false;
    picked = new Set();
  }
</script>

{#if !$session}
  <!-- ===== SETUP ===== -->
  <div class="space-y-4" in:fade>
    <div class="card space-y-1">
      <h3 class="font-display font-bold text-lg neon-text">Americano Mixer</h3>
      <p class="text-sm tx-muted">
        Everyone partners and battles everyone across a balanced rotation — no game ever
        repeats. Pick who's playing (4 or more).
      </p>
    </div>

    <div>
      <div class="label flex justify-between">
        <span>Who's playing?</span>
        <span class="{canStart ? 'neon-text' : 'accent-el'}" style={canStart ? '' : 'color:#ff5e3a;'}>
          {picked.size} selected{canStart ? '' : ' · need 4+'}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        {#each $players as p}
          {@const on = picked.has(p.id)}
          <button class="glass rounded-xl px-3 py-2.5 flex items-center gap-2 transition"
                  style="border-color:{on ? p.avatarColor + '77' : 'var(--border)'};{on ? 'box-shadow:0 0 16px -8px ' + p.avatarColor : ''}"
                  onclick={() => toggle(p.id)}>
            <Avatar player={p} size={30} />
            <span class="text-sm font-medium truncate {on ? 'tx' : 'tx-faint'}">{p.name}</span>
            {#if on}<span class="ml-auto text-xs" style="color:{p.avatarColor};">✓</span>{/if}
          </button>
        {/each}
      </div>
      {#if canStart}
        <p class="text-[11px] tx-faint mt-2 text-center">
          4 on court each round{restPerRound > 0 ? ` · ${restPerRound} rest and rotate` : ' · nobody sits out'}
        </p>
      {/if}
    </div>

    <div class="card space-y-2">
      <div class="label flex justify-between !mb-0">
        <span>Session length</span>
        <span class="neon-text">{minutes} min · {rounds} rounds</span>
      </div>
      <input type="range" min="60" max="210" step="15" bind:value={minutes}
             class="w-full accent-[color:var(--color-neon-green)]" />
      <div class="flex justify-between text-[10px] tx-faint"><span>1h</span><span>2.5h</span><span>3.5h</span></div>
    </div>

    <button class="btn btn-primary w-full text-lg" disabled={!canStart} onclick={start}
            style={canStart ? '' : 'opacity:0.4;pointer-events:none;'}>
      ⚡ Generate Schedule
    </button>
  </div>
{:else}
  <!-- ===== LIVE SESSION ===== -->
  <div class="space-y-4" in:fade>
    <!-- Progress -->
    <div class="card flex items-center justify-between">
      <div>
        <div class="font-display font-bold neon-text">Courtside Scoreboard</div>
        <div class="text-xs tx-muted">{playedCount} / {totalRounds} rounds scored</div>
      </div>
      <button class="btn btn-ghost text-sm" onclick={() => (showFinalize = true)}>Finish ▸</button>
    </div>
    <div class="h-1.5 rounded-full overflow-hidden" style="background:color-mix(in srgb, var(--tx) 12%, transparent);">
      <div class="h-full bg-[color:var(--color-neon-green)] transition-all duration-500"
           style="width:{totalRounds ? (playedCount / totalRounds) * 100 : 0}%"></div>
    </div>

    <!-- Live leaderboard -->
    <div class="card space-y-2">
      <div class="label !mb-0">Session Leaderboard</div>
      {#each leaderboard as row, i (row.player.id)}
        <div class="flex items-center gap-2.5" animate:flip={{ duration: 400 }}>
          <span class="w-5 text-center font-bold {i === 0 ? 'neon-text' : 'tx-faint'}">{i + 1}</span>
          <Avatar player={row.player} size={30} />
          <span class="flex-1 truncate text-sm font-medium tx">{row.player.name}</span>
          <span class="text-xs tx-muted">{row.wins}W</span>
          <span class="font-display font-bold text-lg mono {i === 0 ? 'neon-text' : 'tx'}">{row.points}</span>
        </div>
      {/each}
    </div>

    <!-- Rounds -->
    <div class="space-y-2.5">
      {#each $session.rounds as round, i (round.round)}
        <RoundCard {round} index={i} {playersById} onscore={updateRoundScore} isNext={i === nextIndex} />
      {/each}
    </div>

    <button class="btn btn-primary w-full text-lg" onclick={() => (showFinalize = true)}>
      🏁 Finalize Session
    </button>
  </div>

  <!-- ===== FINALIZE MODAL ===== -->
  {#if showFinalize}
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
         transition:fade={{ duration: 150 }}
         onclick={(e) => { if (e.target === e.currentTarget && !merged) showFinalize = false; }}
         role="presentation">
      <div class="glass rounded-3xl p-5 w-full max-w-sm space-y-4" transition:fly={{ y: 30, duration: 250 }}
           role="dialog" aria-modal="true" tabindex="-1">
        {#if !merged}
          <div class="text-center space-y-1">
            <div class="text-4xl">🏆</div>
            <h3 class="font-display font-bold text-lg">Finalize this Americano?</h3>
            <p class="text-sm tx-muted">
              {playedCount} of {totalRounds} rounds have scores. Merge these points into everyone's lifetime stats?
            </p>
          </div>
          <!-- Podium preview -->
          <div class="space-y-1.5">
            {#each leaderboard.slice(0, 3) as row, i}
              <div class="flex items-center gap-2 text-sm">
                <span>{['🥇', '🥈', '🥉'][i]}</span>
                <span class="flex-1 truncate">{row.player.name}</span>
                <span class="font-bold neon-text">{row.points} pts</span>
              </div>
            {/each}
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn btn-ghost" onclick={() => (showFinalize = false)}>Keep playing</button>
            <button class="btn btn-primary" onclick={doMerge}>Merge stats 🎉</button>
          </div>
          <button class="text-xs tx-faint w-full pt-1" onclick={finishAndClose}>
            Discard session without merging
          </button>
        {:else}
          <div class="text-center space-y-2 py-2" in:fade>
            <div class="text-5xl">🎉</div>
            <h3 class="font-display font-bold text-lg neon-text">Merged!</h3>
            <p class="text-sm tx-muted">Lifetime stats updated. Great session.</p>
            <button class="btn btn-primary w-full mt-2" onclick={finishAndClose}>Done</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}
