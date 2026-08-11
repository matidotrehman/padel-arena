<script>
  import Avatar from './Avatar.svelte';
  import { roundPlayed } from '../logic/americano.js';

  let { round, index, playersById, onscore, isNext = false } = $props();

  const teamA = $derived(round.teamA.map((id) => playersById[id]).filter(Boolean));
  const teamB = $derived(round.teamB.map((id) => playersById[id]).filter(Boolean));
  const resting = $derived(round.resting.map((id) => playersById[id]).filter(Boolean));

  const done = $derived(roundPlayed(round));
  const aWon = $derived(done && +round.scoreA > +round.scoreB);
  const bWon = $derived(done && +round.scoreB > +round.scoreA);
  const hasScore = $derived(round.scoreA != null || round.scoreB != null);

  function set(field, val) {
    const v = val === '' ? null : Math.max(0, +val);
    const a = field === 'a' ? v : round.scoreA;
    const b = field === 'b' ? v : round.scoreB;
    onscore(index, a, b);
  }

  function markNotPlayed() {
    onscore(index, null, null);
  }
</script>

<div class="glass rounded-2xl p-3 space-y-2.5"
     style={isNext
       ? 'border-color:color-mix(in srgb, var(--accent-fg) 50%, transparent);box-shadow:0 0 22px -10px color-mix(in srgb, var(--accent-fg) 70%, transparent);'
       : done ? 'border-color:color-mix(in srgb, var(--accent-fg) 25%, transparent);' : ''}>
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-1.5">
      <span class="chip tx-muted" style="background:color-mix(in srgb, var(--tx) 7%, transparent);">Round {round.round}</span>
      {#if isNext}<span class="chip neon-text" style="background:color-mix(in srgb, var(--accent-fg) 16%, transparent);">▶ Up next</span>{/if}
    </div>
    <div class="flex items-center gap-2">
      {#if resting.length}
        <span class="text-[11px] tx-faint truncate">😴 {resting.map((p) => p.name).join(', ')}</span>
      {/if}
      {#if hasScore}
        <button class="chip tx-muted hover:text-hot" style="background:color-mix(in srgb, var(--tx) 7%, transparent);"
                onclick={markNotPlayed}>🚫 Not played</button>
      {:else}
        <span class="chip tx-faint" style="background:color-mix(in srgb, var(--tx) 5%, transparent);">Not played</span>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
    <!-- Team A -->
    <div class="flex flex-col gap-1 {aWon ? '' : done ? 'opacity-50' : ''}">
      {#each teamA as p}
        <div class="flex items-center gap-1.5"><Avatar player={p} size={26} /><span class="text-sm truncate">{p.name}</span></div>
      {/each}
      <input class="input text-center text-lg font-bold py-1.5 mt-1 {aWon ? 'accent-el' : ''}" type="number" min="0" inputmode="numeric"
             placeholder="0" value={round.scoreA ?? ''} oninput={(e) => set('a', e.target.value)}
             style={aWon ? 'border-color:var(--accent-fg);color:var(--accent-fg);' : ''} />
    </div>

    <div class="font-display font-bold tx-faint text-xs">VS</div>

    <!-- Team B -->
    <div class="flex flex-col gap-1 {bWon ? '' : done ? 'opacity-50' : ''}">
      {#each teamB as p}
        <div class="flex items-center gap-1.5"><Avatar player={p} size={26} /><span class="text-sm truncate">{p.name}</span></div>
      {/each}
      <input class="input text-center text-lg font-bold py-1.5 mt-1 {bWon ? 'accent-el' : ''}" type="number" min="0" inputmode="numeric"
             placeholder="0" value={round.scoreB ?? ''} oninput={(e) => set('b', e.target.value)}
             style={bWon ? 'border-color:var(--grad-b);color:var(--grad-b);' : ''} />
    </div>
  </div>
</div>
