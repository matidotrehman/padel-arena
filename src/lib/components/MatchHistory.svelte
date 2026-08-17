<script>
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { matches, players, deleteMatch, editMatch, fixedOutcome } from '../stores/store.js';
  import { sessionTotals, roundPlayed } from '../logic/americano.js';
  import { checkPin } from '../logic/pin.js';
  import Avatar from './Avatar.svelte';
  import RoundCard from './RoundCard.svelte';
  import { Volleyball, User, Shuffle, ScrollText, Pencil, Trash2, Trophy } from '@lucide/svelte';

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

  const byId = $derived(Object.fromEntries($players.map((p) => [p.id, p])));
  const name = (id) => byId[id]?.name ?? 'Removed';

  // newest first
  const list = $derived([...$matches].sort((a, b) => (b.date || 0) - (a.date || 0)));

  const MODES = {
    fixed: { icon: Volleyball, label: 'Fixed 2v2' },
    individual: { icon: User, label: 'Individual' },
    americano: { icon: Shuffle, label: 'Americano' },
  };

  function when(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  // Per-match view models
  function individualRows(m) {
    return [...(m.entries || [])]
      .map((e) => ({ id: e.id, points: +e.points || 0, won: (m.winnerIds || []).includes(e.id) }))
      .sort((a, b) => b.points - a.points);
  }
  function americanoTop(m) {
    const rounds = m.rounds || [];
    const ids = [...new Set(rounds.flatMap((r) => [...(r.teamA || []), ...(r.teamB || [])]))];
    const totals = sessionTotals(rounds, ids);
    return Object.entries(totals)
      .map(([id, t]) => ({ id, points: t.points, wins: t.wins }))
      .sort((a, b) => b.points - a.points);
  }
  const roundsPlayed = (m) => (m.rounds || []).filter(roundPlayed).length;

  // Full session standings for the Americano detail sheet.
  function americanoStandings(m) {
    const rounds = m.rounds || [];
    const ids = [...new Set(rounds.flatMap((r) => [...(r.teamA || []), ...(r.teamB || [])]))];
    const totals = sessionTotals(rounds, ids);
    return Object.entries(totals)
      .map(([id, t]) => ({ id, ...t }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins);
  }

  let confirmDel = $state(null);
  let sessionDetail = $state(null); // an americano match to show in full

  // ---- Edit flow: scores only, teams/participants stay fixed ----
  let editTarget = $state(null); // the match being edited
  let editDraft = $state(null); // working copy of just the editable fields
  let editPin = $state('');
  let editPinError = $state('');

  function openEdit(m) {
    editPin = '';
    editPinError = '';
    if (m.mode === 'fixed') {
      editDraft = { sets: (m.sets || []).map((s) => ({ a: String(s.a ?? ''), b: String(s.b ?? '') })) };
    } else if (m.mode === 'individual') {
      editDraft = {
        entries: (m.entries || []).map((e) => ({ id: e.id, points: String(e.points ?? '') })),
        winnerIds: [...(m.winnerIds || [])],
      };
    } else if (m.mode === 'americano') {
      editDraft = { rounds: (m.rounds || []).map((r) => ({ ...r })) };
    } else {
      return;
    }
    editTarget = m;
  }

  function closeEdit() {
    editTarget = null;
    editDraft = null;
    editPin = '';
    editPinError = '';
  }

  function toggleEditWinner(id) {
    const set = new Set(editDraft.winnerIds);
    set.has(id) ? set.delete(id) : set.add(id);
    editDraft.winnerIds = [...set];
  }

  function setEditRoundScore(index, a, b) {
    editDraft.rounds[index] = { ...editDraft.rounds[index], scoreA: a, scoreB: b };
  }

  async function saveEdit() {
    if (!(await checkPin(editPin))) {
      editPinError = 'Incorrect PIN';
      return;
    }
    if (editTarget.mode === 'fixed') {
      editMatch(editTarget.id, {
        sets: editDraft.sets
          .filter((s) => s.a !== '' && s.b !== '')
          .map((s) => ({ a: +s.a, b: +s.b })),
      });
    } else if (editTarget.mode === 'individual') {
      editMatch(editTarget.id, {
        entries: editDraft.entries.map((e) => ({ id: e.id, points: +e.points || 0 })),
        winnerIds: editDraft.winnerIds,
      });
    } else if (editTarget.mode === 'americano') {
      editMatch(editTarget.id, { rounds: editDraft.rounds });
    }
    closeEdit();
  }
</script>

<div class="space-y-3">
  <div class="card">
    <h3 class="font-display font-bold neon-text">Match History</h3>
    <p class="text-sm tx-muted">Every logged game, newest first. Delete a mistake and everyone's stats recalculate automatically.</p>
  </div>

  {#if list.length === 0}
    <div class="card text-center py-10 tx-muted" in:fade={{ easing: easeOutSmooth }}>
      <div class="flex justify-center mb-2 tx-faint"><ScrollText size={36} strokeWidth={1.75} /></div>
      <p class="font-semibold tx">No matches logged yet</p>
      <p class="text-sm">Games you log or Americano sessions you finalize show up here.</p>
    </div>
  {/if}

  <div class="relative pl-1.5 space-y-3">
    {#if list.length}
      <div class="absolute left-[9px] top-3 bottom-3 w-px" style="background:color-mix(in srgb, var(--accent-fg) 28%, transparent);"></div>
    {/if}
    {#each list as m, i (m.id)}
    {@const mode = MODES[m.mode] || { icon: Volleyball, label: m.mode }}
    {@const ModeIcon = mode.icon}
    <div class="relative pl-6" animate:flip={{ duration: 300, easing: easeOutSmooth }} in:fly={{ y: 12, duration: 200, delay: Math.min(i, 6) * 30, easing: easeOutSmooth }}>
      <span class="absolute left-[5px] top-4 w-2.5 h-2.5 rounded-full z-10" style="background:var(--accent-fg);box-shadow:0 0 0 3px var(--page-solid), 0 0 8px -1px var(--accent-fg);"></span>
      <div class="card space-y-2.5">
      <div class="flex items-center gap-2">
        <span class="chip inline-flex items-center gap-1" style="background:color-mix(in srgb, var(--tx) 7%, transparent);"><ModeIcon size={12} strokeWidth={2.25} /> {mode.label}</span>
        <span class="text-xs tx-faint">{when(m.date)}</span>
        <button class="ml-auto tx-muted hover:text-hot px-2 transition-transform duration-150 hover:scale-110 active:scale-90" style="transition-timing-function:var(--ease-spring);" aria-label="Edit match"
                onclick={() => openEdit(m)}><Pencil size={14} strokeWidth={2.25} /></button>
        <button class="tx-faint hover:text-hot px-2 -mr-1 transition-transform duration-150 hover:scale-110 active:scale-90" style="transition-timing-function:var(--ease-spring);" aria-label="Delete match"
                onclick={() => (confirmDel = m)}><Trash2 size={14} strokeWidth={2.25} /></button>
      </div>

      {#if m.mode === 'fixed'}
        {@const o = fixedOutcome(m)}
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div class="text-right {o.aWins ? '' : 'opacity-55'}">
            <div class="text-sm font-semibold tx leading-tight">{name(m.teamA[0])}<br />{name(m.teamA[1])}</div>
          </div>
          <div class="text-center">
            <div class="mono font-extrabold text-lg">
              <span class={o.aWins ? 'neon-text' : 'tx'}>{o.scoreA}</span>
              <span class="tx-faint">–</span>
              <span class={!o.aWins ? 'neon-text' : 'tx'}>{o.scoreB}</span>
            </div>
          </div>
          <div class="text-left {o.aWins ? 'opacity-55' : ''}">
            <div class="text-sm font-semibold tx leading-tight">{name(m.teamB[0])}<br />{name(m.teamB[1])}</div>
          </div>
        </div>
        {#if (m.sets || []).length > 1}
          <div class="text-center text-xs tx-faint mono">{m.sets.map((s) => `${s.a}–${s.b}`).join('  ·  ')}</div>
        {/if}

      {:else if m.mode === 'individual'}
        <div class="space-y-1">
          {#each individualRows(m) as r}
            <div class="flex items-center gap-2 text-sm">
              <Avatar player={byId[r.id]} size={22} />
              <span class="flex-1 truncate tx {r.won ? 'font-semibold' : ''}">{name(r.id)}</span>
              {#if r.won}<span class="neon-text"><Trophy size={13} strokeWidth={2.25} /></span>{/if}
              <span class="mono font-bold {r.won ? 'neon-text' : 'tx'}">{r.points}</span>
            </div>
          {/each}
        </div>

      {:else if m.mode === 'americano'}
        {@const top = americanoTop(m)}
        <button class="w-full text-left space-y-1 transition-transform duration-150 hover:brightness-110 active:scale-[0.98]" style="transition-timing-function:var(--ease-spring);" onclick={() => (sessionDetail = m)}>
          <div class="text-xs flex items-center justify-between">
            <span class="tx-muted">{roundsPlayed(m)} rounds · {top.length} players</span>
            <span class="neon-text font-semibold">Full results ›</span>
          </div>
          {#each top.slice(0, 3) as r, idx}
            <div class="flex items-center gap-2 text-sm">
              <span class="w-4 text-center">{['🥇', '🥈', '🥉'][idx]}</span>
              <span class="flex-1 truncate tx">{name(r.id)}</span>
              <span class="mono font-bold {idx === 0 ? 'neon-text' : 'tx'}">{r.points}</span>
            </div>
          {/each}
          {#if top.length > 3}
            <div class="text-[11px] tx-faint pl-6">+{top.length - 3} more…</div>
          {/if}
        </button>
      {/if}
      </div>
    </div>
    {/each}
  </div>
</div>

{#if sessionDetail}
  {@const st = americanoStandings(sessionDetail)}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 backdrop-blur-sm" style="background:var(--scrim);"
       transition:fade={{ duration: 150, easing: easeOutSmooth }}
       onclick={(e) => { if (e.target === e.currentTarget) sessionDetail = null; }} role="presentation">
    <div class="glass rounded-[var(--radius-lg)] w-full max-w-md max-h-[85dvh] overflow-y-auto p-5 space-y-4"
         transition:fly={{ y: 30, duration: 250, easing: easeSpring }} role="dialog" aria-modal="true" tabindex="-1">
      <div>
        <div class="h-display font-extrabold text-lg tx flex items-center gap-1.5"><Shuffle size={16} strokeWidth={2.25} /> Americano</div>
        <div class="text-xs tx-muted">{when(sessionDetail.date)} · {roundsPlayed(sessionDetail)} rounds · {st.length} players</div>
      </div>

      <!-- Full standings -->
      <div>
        <div class="label !mb-1.5">Final standings</div>
        <div class="space-y-1">
          {#each st as r, idx (r.id)}
            <div class="glass rounded-[var(--radius-md)] px-3 py-2 flex items-center gap-2.5">
              <span class="w-6 text-center">{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}</span>
              <Avatar player={byId[r.id]} size={28} />
              <span class="flex-1 truncate text-sm font-medium tx">{name(r.id)}</span>
              <span class="text-[11px] tx-faint mono">{r.wins}W · {r.games}g</span>
              <span class="mono font-bold text-lg {idx === 0 ? 'neon-text' : 'tx'} w-8 text-right">{r.points}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Round by round -->
      <div>
        <div class="label !mb-1.5">Round by round</div>
        <div class="space-y-1">
          {#each sessionDetail.rounds as g}
            {@const a = +g.scoreA}
            {@const b = +g.scoreB}
            {@const scored = roundPlayed(g)}
            <div class="flex items-center gap-2 text-xs {scored ? '' : 'opacity-45'}">
              <span class="w-5 tx-faint mono">{g.round}</span>
              <span class="flex-1 text-right truncate {scored && a > b ? 'tx font-semibold' : 'tx-muted'}">{(g.teamA || []).map(name).join(' & ')}</span>
              <span class="mono font-bold w-16 text-center {scored ? 'tx' : 'tx-faint'}">{scored ? `${a}–${b}` : 'not played'}</span>
              <span class="flex-1 truncate {scored && b > a ? 'tx font-semibold' : 'tx-muted'}">{(g.teamB || []).map(name).join(' & ')}</span>
            </div>
          {/each}
        </div>
      </div>

      <button class="btn btn-ghost w-full" onclick={() => (sessionDetail = null)}>Close</button>
    </div>
  </div>
{/if}

{#if confirmDel}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style="background:var(--scrim);" transition:fade={{ duration: 150, easing: easeOutSmooth }}
       onclick={(e) => { if (e.target === e.currentTarget) confirmDel = null; }} role="presentation">
    <div class="glass rounded-[var(--radius-lg)] p-5 w-full max-w-sm space-y-3 text-center" role="dialog" aria-modal="true" tabindex="-1"
         transition:fly={{ y: 20, duration: 200, easing: easeSpring }}>
      <div class="flex justify-center text-hot"><Trash2 size={30} strokeWidth={1.75} /></div>
      <h3 class="font-display font-bold">Delete this match?</h3>
      <p class="text-sm tx-muted">The match is removed and everyone's lifetime stats recalculate from the remaining games. This can't be undone.</p>
      <div class="grid grid-cols-2 gap-2">
        <button class="btn btn-ghost" onclick={() => (confirmDel = null)}>Cancel</button>
        <button class="btn btn-primary" style="background:linear-gradient(180deg, color-mix(in srgb, var(--color-hot) 70%, white), var(--color-hot));"
                onclick={() => { deleteMatch(confirmDel.id); confirmDel = null; }}>Delete</button>
      </div>
    </div>
  </div>
{/if}

{#if editTarget}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 backdrop-blur-sm" style="background:var(--scrim);"
       transition:fade={{ duration: 150, easing: easeOutSmooth }}
       onclick={(e) => { if (e.target === e.currentTarget) closeEdit(); }} role="presentation">
    <div class="glass rounded-[var(--radius-lg)] w-full max-w-md max-h-[85dvh] overflow-y-auto p-5 space-y-4"
         transition:fly={{ y: 30, duration: 250, easing: easeSpring }} role="dialog" aria-modal="true" tabindex="-1">
      <div>
        <div class="h-display font-extrabold text-lg tx flex items-center gap-1.5"><Pencil size={16} strokeWidth={2.25} /> Edit match</div>
        <div class="text-xs tx-muted">Only the scores change — teams and participants stay the same.</div>
      </div>

      {#if editTarget.mode === 'fixed'}
        <div class="space-y-2">
          <div class="label">Set scores</div>
          {#each editDraft.sets as set, i}
            <div class="flex items-center gap-2">
              <span class="text-xs tx-faint w-10">Set {i + 1}</span>
              <input class="input mono text-center" type="number" min="0" placeholder="A" bind:value={set.a} />
              <span class="tx-faint">—</span>
              <input class="input mono text-center" type="number" min="0" placeholder="B" bind:value={set.b} />
            </div>
          {/each}
        </div>

      {:else if editTarget.mode === 'individual'}
        <div class="space-y-2">
          {#each editDraft.entries as e (e.id)}
            <div class="glass rounded-[var(--radius-md)] px-3 py-2.5 flex items-center gap-3">
              <Avatar player={byId[e.id]} size={30} />
              <span class="flex-1 truncate font-medium tx">{name(e.id)}</span>
              <input class="input mono w-16 text-center py-1.5" type="number" min="0" placeholder="pts"
                     bind:value={e.points} />
              <button class="transition-transform duration-150 hover:scale-110 active:scale-90 {editDraft.winnerIds.includes(e.id) ? 'neon-text' : 'tx-faint opacity-30 grayscale'}"
                      style="transition-timing-function:var(--ease-spring);"
                      onclick={() => toggleEditWinner(e.id)} aria-label="Toggle winner">
                <Trophy size={20} strokeWidth={2.25} />
              </button>
            </div>
          {/each}
        </div>

      {:else if editTarget.mode === 'americano'}
        <div class="space-y-2">
          {#each editDraft.rounds as round, idx}
            <RoundCard {round} index={idx} playersById={byId} onscore={setEditRoundScore} />
          {/each}
        </div>
      {/if}

      <div class="space-y-2 pt-1 border-t" style="border-color:var(--border);">
        <input class="input text-center" type="password" inputmode="numeric" placeholder="Enter PIN to save" autocomplete="off"
               bind:value={editPin} onkeydown={(e) => e.key === 'Enter' && saveEdit()} />
        {#if editPinError}<p class="text-sm text-hot text-center">{editPinError}</p>{/if}
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-ghost" onclick={closeEdit}>Cancel</button>
          <button class="btn btn-primary" onclick={saveEdit}>Save</button>
        </div>
      </div>
    </div>
  </div>
{/if}
