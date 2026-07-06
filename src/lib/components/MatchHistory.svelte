<script>
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { matches, players, deleteMatch, fixedOutcome } from '../stores/store.js';
  import { sessionTotals } from '../logic/americano.js';
  import Avatar from './Avatar.svelte';

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
  const roundsPlayed = (m) => (m.rounds || []).filter((r) => r.scoreA != null && r.scoreB != null).length;

  let confirmDel = $state(null);
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

  {#each list as m, i (m.id)}
    {@const mode = MODES[m.mode] || { icon: '🎾', label: m.mode }}
    <div class="card space-y-2.5" animate:flip={{ duration: 300 }} in:fly={{ y: 12, duration: 200, delay: Math.min(i, 6) * 30 }}>
      <div class="flex items-center gap-2">
        <span class="chip" style="background:color-mix(in srgb, var(--tx) 7%, transparent);">{mode.icon} {mode.label}</span>
        <span class="text-xs tx-faint">{when(m.date)}</span>
        <button class="ml-auto tx-faint hover:text-hot px-2 -mr-1 text-sm" aria-label="Delete match"
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
        <div class="text-xs tx-muted">{roundsPlayed(m)} rounds · {top.length} players</div>
        <div class="space-y-1">
          {#each top.slice(0, 3) as r, idx}
            <div class="flex items-center gap-2 text-sm">
              <span class="w-4 text-center">{['🥇', '🥈', '🥉'][idx]}</span>
              <span class="flex-1 truncate tx">{name(r.id)}</span>
              <span class="mono font-bold {idx === 0 ? 'neon-text' : 'tx'}">{r.points}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

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
