<script>
  import Avatar from './Avatar.svelte';

  let { round, index, playersById, onscore } = $props();

  const teamA = $derived(round.teamA.map((id) => playersById[id]).filter(Boolean));
  const teamB = $derived(round.teamB.map((id) => playersById[id]).filter(Boolean));
  const resting = $derived(round.resting.map((id) => playersById[id]).filter(Boolean));

  const done = $derived(round.scoreA != null && round.scoreB != null);
  const aWon = $derived(done && +round.scoreA > +round.scoreB);
  const bWon = $derived(done && +round.scoreB > +round.scoreA);

  function set(field, val) {
    const v = val === '' ? null : Math.max(0, +val);
    const a = field === 'a' ? v : round.scoreA;
    const b = field === 'b' ? v : round.scoreB;
    onscore(index, a, b);
  }
</script>

<div class="glass rounded-2xl p-3 space-y-2.5" style={done ? 'border-color:rgba(182,255,46,0.25);' : ''}>
  <div class="flex items-center justify-between">
    <span class="chip tx-muted" style="background:color-mix(in srgb, var(--tx) 7%, transparent);">Round {round.round}</span>
    {#if resting.length}
      <span class="text-[11px] tx-faint">😴 Resting: {resting.map((p) => p.name).join(', ')}</span>
    {/if}
  </div>

  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
    <!-- Team A -->
    <div class="flex flex-col gap-1 {aWon ? '' : done ? 'opacity-50' : ''}">
      {#each teamA as p}
        <div class="flex items-center gap-1.5"><Avatar player={p} size={26} /><span class="text-sm truncate">{p.name}</span></div>
      {/each}
      <input class="input text-center text-lg font-bold py-1.5 mt-1 {aWon ? 'accent-el' : ''}" type="number" min="0" inputmode="numeric"
             placeholder="0" value={round.scoreA ?? ''} oninput={(e) => set('a', e.target.value)}
             style={aWon ? 'border-color:#c6ff32;color:#c6ff32;' : ''} />
    </div>

    <div class="font-display font-bold tx-faint text-xs">VS</div>

    <!-- Team B -->
    <div class="flex flex-col gap-1 {bWon ? '' : done ? 'opacity-50' : ''}">
      {#each teamB as p}
        <div class="flex items-center gap-1.5"><Avatar player={p} size={26} /><span class="text-sm truncate">{p.name}</span></div>
      {/each}
      <input class="input text-center text-lg font-bold py-1.5 mt-1 {bWon ? 'accent-el' : ''}" type="number" min="0" inputmode="numeric"
             placeholder="0" value={round.scoreB ?? ''} oninput={(e) => set('b', e.target.value)}
             style={bWon ? 'border-color:#2ff0d6;color:#2ff0d6;' : ''} />
    </div>
  </div>
</div>
