<script>
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { players, matches, mergeAmericano } from '../stores/store.js';
  import { session, startSession, updateRoundScore, endSession } from '../stores/session.js';
  import { generateSchedule, suggestedRounds, sessionTotals, roundPlayed, pairKey } from '../logic/americano.js';
  import { headToHead } from '../logic/h2h.js';
  import { celebrate } from '../logic/celebrate.js';
  import RoundCard from './RoundCard.svelte';
  import Avatar from './Avatar.svelte';
  import { Check, Zap, Flag, Trophy, PartyPopper, Loader2 } from '@lucide/svelte';

  // JS equivalents of the CSS --ease-spring / --ease-out-smooth tokens, for use in
  // Svelte's fly/fade transitions (which take an easing function, not a CSS string).
  function cubicBezier(x1, y1, x2, y2) {
    const A = (a1, a2) => 1 - 3 * a2 + 3 * a1;
    const B = (a1, a2) => 3 * a2 - 6 * a1;
    const C = (a1) => 3 * a1;
    const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
    const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
    return (x) => {
      let t = x;
      for (let i = 0; i < 4; i++) {
        const s = slope(t, x1, x2);
        if (s === 0) break;
        t -= (calc(t, x1, x2) - x) / s;
      }
      return calc(t, y1, y2);
    };
  }
  const easeSpring = cubicBezier(0.34, 1.56, 0.64, 1);
  const easeOutSmooth = cubicBezier(0.16, 1, 0.3, 1);

  // ---- Setup state ----
  let picked = $state(new Set());
  let minutes = $state(150);
  // Rounds default to the time-based suggestion, but the "Matches" slider
  // below lets you set an exact count directly — once touched, it stops
  // following the minutes slider.
  let rounds = $state(suggestedRounds(150));
  let roundsCustomized = $state(false);
  $effect(() => {
    if (!roundsCustomized) rounds = suggestedRounds(minutes);
  });
  function onRoundsInput() {
    roundsCustomized = true;
  }
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

  let generating = $state(false);

  // How many times each pair has already partnered across ALL past matches
  // (fixed 2v2 + previous Americano sessions) — fed into generateSchedule as
  // a soft bias so a pair that's under-paired in history gets pulled toward
  // pairing more this session, instead of every session starting blind.
  function historicalPartnerCounts(ids) {
    const h = headToHead($matches);
    const map = {};
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const rec = (h[ids[i]] && h[ids[i]][ids[j]]) || { partW: 0, partL: 0 };
        map[pairKey(ids[i], ids[j])] = rec.partW + rec.partL;
      }
    }
    return map;
  }

  async function start() {
    if (!canStart || generating) return;
    generating = true;
    await new Promise((r) => setTimeout(r)); // let the busy state paint first
    const ids = $players.filter((p) => picked.has(p.id)).map((p) => p.id);
    const priorPartnerCount = historicalPartnerCounts(ids);
    const { rounds: schedule } = generateSchedule(ids, rounds, priorPartnerCount);
    generating = false;
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
  const playedCount = $derived($session ? $session.rounds.filter(roundPlayed).length : 0);
  const totalRounds = $derived($session ? $session.rounds.length : 0);
  // First not-yet-played round → "Up next" on the courtside sheet.
  const nextIndex = $derived($session ? $session.rounds.findIndex((r) => !roundPlayed(r)) : -1);

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
  <div class="space-y-4" in:fade={{ duration: 200, easing: easeOutSmooth }}>
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
        <span class={canStart ? 'neon-text' : 'text-hot'}>
          {picked.size} selected{canStart ? '' : ' · need 4+'}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        {#each $players as p}
          {@const on = picked.has(p.id)}
          <button class="glass rounded-[var(--radius-md)] px-3 py-2.5 flex items-center gap-2 transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
                  style="border-color:{on ? p.avatarColor + '77' : 'var(--border)'};{on ? 'box-shadow:0 0 16px -8px ' + p.avatarColor : ''};transition-timing-function:var(--ease-spring);"
                  onclick={() => toggle(p.id)}>
            <Avatar player={p} size={30} />
            <span class="text-sm font-medium truncate {on ? 'tx' : 'tx-faint'}">{p.name}</span>
            {#if on}<span class="ml-auto" style="color:{p.avatarColor};"><Check size={14} strokeWidth={2.75} /></span>{/if}
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
             class="w-full accent-[color:var(--accent-fg)]" />
      <div class="flex justify-between text-[10px] tx-faint"><span>1h</span><span>2.5h</span><span>3.5h</span></div>
    </div>

    <div class="card space-y-2">
      <div class="label flex justify-between !mb-0">
        <span>Matches</span>
        <span class="neon-text">{rounds} rounds</span>
      </div>
      <input type="range" min="4" max="20" step="1" bind:value={rounds} oninput={onRoundsInput}
             class="w-full accent-[color:var(--accent-fg)]" />
      <div class="flex justify-between text-[10px] tx-faint"><span>4</span><span>9</span><span>20</span></div>
    </div>

    <button class="btn btn-primary w-full text-lg" disabled={!canStart || generating} onclick={start}
            style={canStart && !generating ? '' : 'opacity:0.5;pointer-events:none;'}>
      {#if generating}
        <Loader2 size={18} strokeWidth={2.25} class="spin-loader" /> Mixing…
      {:else}
        <Zap size={18} strokeWidth={2.25} /> Generate Schedule
      {/if}
    </button>
  </div>
{:else}
  <!-- ===== LIVE SESSION ===== -->
  <div class="space-y-4" in:fade={{ duration: 200, easing: easeOutSmooth }}>
    <!-- Progress -->
    <div class="card flex items-center justify-between">
      <div>
        <div class="font-display font-bold neon-text">Courtside Scoreboard</div>
        <div class="text-xs tx-muted">{playedCount} / {totalRounds} rounds scored</div>
      </div>
      <button class="btn btn-ghost text-sm" onclick={() => (showFinalize = true)}>Finish ▸</button>
    </div>
    <div class="h-1.5 rounded-full overflow-hidden" style="background:color-mix(in srgb, var(--tx) 12%, transparent);">
      <div class="h-full bg-[color:var(--accent-fg)] transition-all duration-500 [transition-timing-function:var(--ease-out-smooth)]"
           style="width:{totalRounds ? (playedCount / totalRounds) * 100 : 0}%"></div>
    </div>

    <!-- Live leaderboard -->
    <div class="card space-y-2">
      <div class="label !mb-0">Session Leaderboard</div>
      {#each leaderboard as row, i (row.player.id)}
        <div class="flex items-center gap-2.5" animate:flip={{ duration: 400, easing: easeOutSmooth }}>
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
      <Flag size={18} strokeWidth={2.25} /> Finalize Session
    </button>
  </div>

  <!-- ===== FINALIZE MODAL ===== -->
  {#if showFinalize}
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm" style="background:var(--scrim);"
         transition:fade={{ duration: 150, easing: easeOutSmooth }}
         onclick={(e) => { if (e.target === e.currentTarget && !merged) showFinalize = false; }}
         role="presentation">
      <div class="glass rounded-[var(--radius-lg)] p-5 w-full max-w-sm space-y-4" transition:fly={{ y: 30, duration: 250, easing: easeSpring }}
           role="dialog" aria-modal="true" tabindex="-1">
        {#if !merged}
          <div class="text-center space-y-1">
            <div class="hero-shell hero-shell-gold inline-block mx-auto" style="padding:2px;border-radius:999px;">
              <div class="hero-shell-inner grid place-items-center" style="width:64px;height:64px;border-radius:999px;color:var(--accent-gold);">
                <Trophy size={30} strokeWidth={1.75} />
              </div>
            </div>
            <h3 class="h-display font-bold text-lg">Finalize this Americano?</h3>
            <p class="text-sm tx-muted">
              {playedCount} of {totalRounds} rounds have scores. Merge these points into everyone's lifetime stats?
            </p>
          </div>
          <!-- Podium preview -->
          <div class="space-y-1.5">
            {#each leaderboard.slice(0, 3) as row, i}
              <div class="flex items-center gap-2 text-sm {i === 0 ? 'rounded-[var(--radius-sm)] px-2 py-1 -mx-2' : ''}"
                   style={i === 0 ? 'background:color-mix(in srgb, var(--accent-gold) 10%, transparent);' : ''}>
                <span>{['🥇', '🥈', '🥉'][i]}</span>
                <span class="flex-1 truncate" style={i === 0 ? 'color:var(--accent-gold);font-weight:600;' : ''}>{row.player.name}</span>
                <span class="font-bold mono" style="color:{i === 0 ? 'var(--accent-gold)' : 'var(--accent-fg)'};">{row.points} pts</span>
              </div>
            {/each}
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn btn-ghost" onclick={() => (showFinalize = false)}>Keep playing</button>
            <button class="btn btn-primary" onclick={doMerge}>Merge stats <PartyPopper size={16} strokeWidth={2.25} /></button>
          </div>
          <button class="text-xs tx-faint w-full pt-1 transition-colors hover:text-[var(--tx-muted)]" onclick={finishAndClose}>
            Discard session without merging
          </button>
        {:else}
          <div class="text-center space-y-2 py-2" in:fade={{ easing: easeOutSmooth }}>
            <div class="hero-shell hero-shell-gold inline-block mx-auto" style="padding:2px;border-radius:999px;">
              <div class="hero-shell-inner grid place-items-center" style="width:72px;height:72px;border-radius:999px;color:var(--accent-gold);">
                <PartyPopper size={36} strokeWidth={1.75} />
              </div>
            </div>
            <h3 class="h-display font-bold text-lg" style="color:var(--accent-gold);">Merged!</h3>
            <p class="text-sm tx-muted">Lifetime stats updated. Great session.</p>
            <button class="btn btn-primary w-full mt-2" onclick={finishAndClose}>Done</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}
