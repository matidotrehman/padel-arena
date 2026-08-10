<script>
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { matches, players, deleteMatch, editMatch, fixedOutcome } from '../stores/store.js';
  import { sessionTotals, roundPlayed } from '../logic/americano.js';
  import { checkPin } from '../logic/pin.js';
  import Avatar from './Avatar.svelte';
  import RoundCard from './RoundCard.svelte';

  const byId = $derived(Object.fromEntries($players.map((p) => [p.id, p])));
  const name = (id) => byId[id]?.name ?? 'Removed';

  // newest first
  const list = $derived([...$matches].sort((a, b) => (b.date || 0) - (a.date || 0)));

  const MODES = {
    fixed: { icon: '🎾', label: 'Fixed 2v2' },
    individual: { icon: '👤', label: 'Individual' },
    americano: { icon: '🔀', label: 'Americano' },
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
    <div class="card text-center py-10 tx-muted" in:fade>
      <div class="text-4xl mb-2">📜</div>
      <p class="font-semibold tx">No matches logged yet</p>
      <p class="text-sm">Games you log or Americano sessions you finalize show up here.</p>
    </div>
  {/if}

  <div class="relative pl-1.5 space-y-3">
    {#if list.length}
      <div class="absolute left-[9px] top-3 bottom-3 w-px" style="background:color-mix(in srgb, var(--accent-fg) 28%, transparent);"></div>
    {/if}
    {#each list as m, i (m.id)}
    {@const mode = MODES[m.mode] || { icon: '🎾', label: m.mode }}
    <div class="relative pl-6" animate:flip={{ duration: 300 }} in:fly={{ y: 12, duration: 200, delay: Math.min(i, 6) * 30 }}>
      <span class="absolute left-[5px] top-4 w-2.5 h-2.5 rounded-full z-10" style="background:var(--accent-fg);box-shadow:0 0 0 3px var(--page-solid), 0 0 8px -1px var(--accent-fg);"></span>
      <div class="card space-y-2.5">
      <div class="flex items-center gap-2">
        <span class="chip" style="background:color-mix(in srgb, var(--tx) 7%, transparent);">{mode.icon} {mode.label}</span>
        <span class="text-xs tx-faint">{when(m.date)}</span>
        <button class="ml-auto tx-muted hover:text-hot px-2 text-sm" aria-label="Edit match"
                onclick={() => openEdit(m)}>✎</button>
        <button class="tx-faint hover:text-hot px-2 -mr-1 text-sm" aria-label="Delete match"
                onclick={() => (confirmDel = m)}>🗑</button>
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
              {#if r.won}<span class="text-xs">🏆</span>{/if}
              <span class="mono font-bold {r.won ? 'neon-text' : 'tx'}">{r.points}</span>
            </div>
          {/each}
        </div>

      {:else if m.mode === 'americano'}
        {@const top = americanoTop(m)}
        <button class="w-full text-left space-y-1 active:scale-[0.99] transition" onclick={() => (sessionDetail = m)}>
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
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-sm"
       transition:fade={{ duration: 150 }}
       onclick={(e) => { if (e.target === e.currentTarget) sessionDetail = null; }} role="presentation">
    <div class="glass rounded-3xl w-full max-w-md max-h-[85dvh] overflow-y-auto p-5 space-y-4"
         transition:fly={{ y: 30, duration: 250 }} role="dialog" aria-modal="true" tabindex="-1">
      <div>
        <div class="h-display font-extrabold text-lg tx">🔀 Americano</div>
        <div class="text-xs tx-muted">{when(sessionDetail.date)} · {roundsPlayed(sessionDetail)} rounds · {st.length} players</div>
      </div>

      <!-- Full standings -->
      <div>
        <div class="label !mb-1.5">Final standings</div>
        <div class="space-y-1">
          {#each st as r, idx (r.id)}
            <div class="glass rounded-xl px-3 py-2 flex items-center gap-2.5">
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
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" transition:fade={{ duration: 150 }}
       onclick={(e) => { if (e.target === e.currentTarget) confirmDel = null; }} role="presentation">
    <div class="glass rounded-3xl p-5 w-full max-w-sm space-y-3 text-center" role="dialog" aria-modal="true" tabindex="-1">
      <div class="text-3xl">🗑</div>
      <h3 class="font-display font-bold">Delete this match?</h3>
      <p class="text-sm tx-muted">The match is removed and everyone's lifetime stats recalculate from the remaining games. This can't be undone.</p>
      <div class="grid grid-cols-2 gap-2">
        <button class="btn btn-ghost" onclick={() => (confirmDel = null)}>Cancel</button>
        <button class="btn btn-primary" style="background:linear-gradient(180deg,#ff8a6a,#ff5e3a);"
                onclick={() => { deleteMatch(confirmDel.id); confirmDel = null; }}>Delete</button>
      </div>
    </div>
  </div>
{/if}

{#if editTarget}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-sm"
       transition:fade={{ duration: 150 }}
       onclick={(e) => { if (e.target === e.currentTarget) closeEdit(); }} role="presentation">
    <div class="glass rounded-3xl w-full max-w-md max-h-[85dvh] overflow-y-auto p-5 space-y-4"
         transition:fly={{ y: 30, duration: 250 }} role="dialog" aria-modal="true" tabindex="-1">
      <div>
        <div class="h-display font-extrabold text-lg tx">✎ Edit match</div>
        <div class="text-xs tx-muted">Only the scores change — teams and participants stay the same.</div>
      </div>

      {#if editTarget.mode === 'fixed'}
        <div class="space-y-2">
          <div class="label">Set scores</div>
          {#each editDraft.sets as set, i}
            <div class="flex items-center gap-2">
              <span class="text-xs tx-faint w-10">Set {i + 1}</span>
              <input class="input text-center" type="number" min="0" placeholder="A" bind:value={set.a} />
              <span class="tx-faint">—</span>
              <input class="input text-center" type="number" min="0" placeholder="B" bind:value={set.b} />
            </div>
          {/each}
        </div>

      {:else if editTarget.mode === 'individual'}
        <div class="space-y-2">
          {#each editDraft.entries as e (e.id)}
            <div class="glass rounded-xl px-3 py-2.5 flex items-center gap-3">
              <Avatar player={byId[e.id]} size={30} />
              <span class="flex-1 truncate font-medium tx">{name(e.id)}</span>
              <input class="input w-16 text-center py-1.5" type="number" min="0" placeholder="pts"
                     bind:value={e.points} />
              <button class="text-xl transition {editDraft.winnerIds.includes(e.id) ? '' : 'opacity-30 grayscale'}"
                      onclick={() => toggleEditWinner(e.id)} aria-label="Toggle winner">🏆</button>
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
