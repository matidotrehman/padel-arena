<script>
  import { fly, fade } from 'svelte/transition';
  import { players, logFixedMatch, logIndividualMatch } from '../stores/store.js';
  import { pop } from '../logic/celebrate.js';
  import Avatar from './Avatar.svelte';
  import { X, Trophy, Volleyball, Check } from '@lucide/svelte';

  let { onlogged } = $props();

  let mode = $state('fixed'); // 'fixed' | 'individual'

  // ---- Fixed partners state ----
  let a1 = $state(''), a2 = $state(''), b1 = $state(''), b2 = $state('');
  let sets = $state([{ a: '', b: '' }]);

  const chosen = $derived([a1, a2, b1, b2].filter(Boolean));
  const fixedValid = $derived(
    a1 && a2 && b1 && b2 &&
    new Set(chosen).size === 4 &&
    sets.some((s) => s.a !== '' && s.b !== '')
  );

  function optionsFor(current) {
    return $players.filter((p) => p.id === current || !chosen.includes(p.id));
  }

  function addSet() {
    sets = [...sets, { a: '', b: '' }];
  }
  function removeSet(i) {
    sets = sets.filter((_, idx) => idx !== i);
  }

  function submitFixed() {
    if (!fixedValid) return;
    logFixedMatch({
      teamA: [a1, a2],
      teamB: [b1, b2],
      sets: sets.filter((s) => s.a !== '' && s.b !== '').map((s) => ({ a: +s.a, b: +s.b })),
    });
    pop(0.5, 0.4);
    a1 = a2 = b1 = b2 = '';
    sets = [{ a: '', b: '' }];
    onlogged?.();
  }

  // ---- Individual state ----
  let selected = $state({}); // id -> bool
  let points = $state({}); // id -> number
  let winners = $state({}); // id -> bool

  const indParticipants = $derived($players.filter((p) => selected[p.id]));
  const indValid = $derived(
    indParticipants.length >= 2 &&
    indParticipants.some((p) => winners[p.id]) &&
    indParticipants.some((p) => (points[p.id] ?? '') !== '')
  );

  function toggleSelect(id) {
    selected = { ...selected, [id]: !selected[id] };
    if (!selected[id]) {
      winners = { ...winners, [id]: false };
    }
  }

  function submitIndividual() {
    if (!indValid) return;
    logIndividualMatch({
      entries: indParticipants.map((p) => ({ id: p.id, points: +points[p.id] || 0 })),
      winnerIds: indParticipants.filter((p) => winners[p.id]).map((p) => p.id),
    });
    pop(0.5, 0.4);
    selected = {};
    points = {};
    winners = {};
    onlogged?.();
  }
</script>

<div class="space-y-4">
  <!-- Mode toggle -->
  <div class="glass rounded-[var(--radius-md)] p-1 grid grid-cols-2 gap-1">
    <button
      class="btn {mode === 'fixed' ? 'btn-primary' : 'tx-muted hover:text-[var(--tx)]'}"
      onclick={() => (mode = 'fixed')}>Fixed Partners</button>
    <button
      class="btn {mode === 'individual' ? 'btn-primary' : 'tx-muted hover:text-[var(--tx)]'}"
      onclick={() => (mode = 'individual')}>Individual</button>
  </div>

  {#if mode === 'fixed'}
    <div class="space-y-4" in:fly={{ y: 12, duration: 200 }}>
      <!-- Teams -->
      <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div class="card space-y-2" style="border-color:color-mix(in srgb, var(--accent-fg) 25%, transparent);">
          <div class="label !mb-0 neon-text">Team A</div>
          {#each [{ get: () => a1, set: (v) => (a1 = v) }, { get: () => a2, set: (v) => (a2 = v) }] as slot}
            <select class="input" value={slot.get()} onchange={(e) => slot.set(e.target.value)}>
              <option value="">Select…</option>
              {#each optionsFor(slot.get()) as p}<option value={p.id}>{p.name}</option>{/each}
            </select>
          {/each}
        </div>
        <div class="font-display font-bold tx-faint text-sm">VS</div>
        <div class="card space-y-2" style="border-color:color-mix(in srgb, var(--accent-fg) 25%, transparent);">
          <div class="label !mb-0 neon-text">Team B</div>
          {#each [{ get: () => b1, set: (v) => (b1 = v) }, { get: () => b2, set: (v) => (b2 = v) }] as slot}
            <select class="input" value={slot.get()} onchange={(e) => slot.set(e.target.value)}>
              <option value="">Select…</option>
              {#each optionsFor(slot.get()) as p}<option value={p.id}>{p.name}</option>{/each}
            </select>
          {/each}
        </div>
      </div>

      <!-- Sets -->
      <div class="space-y-2">
        <div class="label">Set scores</div>
        {#each sets as set, i}
          <div class="flex items-center gap-2" in:fly={{ y: 8, duration: 150 }}>
            <span class="text-xs tx-faint w-10">Set {i + 1}</span>
            <input class="input mono text-center" type="number" min="0" placeholder="A" bind:value={set.a} />
            <span class="tx-faint">—</span>
            <input class="input mono text-center" type="number" min="0" placeholder="B" bind:value={set.b} />
            {#if sets.length > 1}
              <button class="tx-muted hover:text-hot px-2 transition-transform duration-150 hover:scale-110 active:scale-90"
                      style="transition-timing-function: var(--ease-spring);"
                      onclick={() => removeSet(i)} aria-label="Remove set">
                <X size={14} strokeWidth={2.25} />
              </button>
            {/if}
          </div>
        {/each}
        <button class="btn btn-ghost w-full text-sm" onclick={addSet}>+ Add set</button>
      </div>

      <button class="btn btn-primary w-full text-lg" disabled={!fixedValid} onclick={submitFixed}
        style={fixedValid ? '' : 'opacity:0.4;pointer-events:none;'}>
        <Volleyball size={18} strokeWidth={2.25} /> Log Match
      </button>
    </div>
  {:else}
    <div class="space-y-4" in:fly={{ y: 12, duration: 200 }}>
      <p class="text-sm tx-muted">
        Pick who played, enter each player's points, and tap the trophy for winners — partners don't matter here.
      </p>
      <div class="space-y-2">
        {#each $players as p}
          {@const active = selected[p.id]}
          <div class="glass rounded-[var(--radius-md)] px-3 py-2.5 flex items-center gap-3 transition"
               style="border-color:{active ? p.avatarColor + '55' : 'var(--border)'};">
            <button class="flex items-center gap-3 flex-1 min-w-0 py-1 transition-transform duration-150 active:scale-[0.98]"
                    style="transition-timing-function: var(--ease-spring);"
                    onclick={() => toggleSelect(p.id)}>
              <span class="w-5 h-5 rounded-[var(--radius-sm)] border flex items-center justify-center text-xs shrink-0 transition"
                    style="border-color:{p.avatarColor}88;background:{active ? p.avatarColor : 'transparent'};color:#0a0a0b;">
                {#if active}<Check size={12} strokeWidth={3} />{/if}
              </span>
              <Avatar player={p} size={34} />
              <span class="font-medium truncate {active ? 'tx' : 'tx-faint'}">{p.name}</span>
            </button>
            {#if active}
              <div class="flex items-center gap-2" in:fade={{ duration: 150 }}>
                <input class="input mono w-16 text-center py-1.5" type="number" min="0" placeholder="pts"
                       bind:value={points[p.id]} />
                <button class="transition-transform duration-150 hover:scale-110 active:scale-90 {winners[p.id] ? 'neon-text' : 'tx-faint opacity-30 grayscale'}"
                        style="transition-timing-function: var(--ease-spring);"
                        onclick={() => (winners = { ...winners, [p.id]: !winners[p.id] })}
                        aria-label="Mark winner">
                  <Trophy size={20} strokeWidth={2.25} />
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
      <button class="btn btn-primary w-full text-lg" disabled={!indValid} onclick={submitIndividual}
        style={indValid ? '' : 'opacity:0.4;pointer-events:none;'}>
        <Volleyball size={18} strokeWidth={2.25} /> Log Individual Match
      </button>
    </div>
  {/if}
</div>
