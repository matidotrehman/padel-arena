<script>
  import { fade } from 'svelte/transition';
  import { exportState, parseImport } from '../logic/persistence.js';
  import { currentState, replaceState, resetAll } from '../stores/store.js';
  import { syncStatus, syncNow } from '../logic/sync.js';
  import { checkPin } from '../logic/pin.js';

  let fileInput;
  let toast = $state('');
  let confirmImport = $state(null); // parsed pending state
  let confirmReset = $state(false);
  let resetPin = $state('');
  let resetPinError = $state('');

  const cloud = $derived({
    connecting: { icon: '⏳', label: 'Connecting to the group…', tone: 'var(--tx-muted)' },
    syncing: { icon: '☁️', label: 'Syncing changes…', tone: 'var(--accent-fg)' },
    synced: { icon: '✅', label: 'Shared live with your group', tone: 'var(--accent-fg)' },
    local: { icon: '📴', label: 'Local only on this device', tone: '#ff8a3a' },
  }[$syncStatus.mode]);

  function agoText(ts) {
    if (!ts) return '';
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return `${s}s ago`;
    return `${Math.round(s / 60)}m ago`;
  }

  let now = $state(Date.now());
  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 5000);
    return () => clearInterval(t);
  });

  function flash(msg) {
    toast = msg;
    setTimeout(() => (toast = ''), 2600);
  }

  function onExport() {
    exportState(currentState());
    flash('Exported padel_stats.json ✓');
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        confirmImport = parseImport(String(reader.result));
      } catch {
        flash('⚠️ Invalid file — could not import.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function applyImport() {
    replaceState(confirmImport);
    const n = confirmImport.players.length;
    confirmImport = null;
    flash(`Imported ${n} players ✓`);
  }

  function openReset() {
    resetPin = '';
    resetPinError = '';
    confirmReset = true;
  }

  function closeReset() {
    confirmReset = false;
    resetPin = '';
    resetPinError = '';
  }

  async function doReset() {
    if (!(await checkPin(resetPin))) {
      resetPinError = 'Incorrect PIN';
      return;
    }
    resetAll();
    closeReset();
    flash('Reset to the 6 originals ✓');
  }
</script>

<div class="space-y-3">
  <!-- Live cloud sync status -->
  <div class="card flex items-center gap-3" style="border-color:color-mix(in srgb, {cloud.tone} 35%, transparent);">
    <span class="text-2xl">{cloud.icon}</span>
    <div class="min-w-0 flex-1">
      <div class="font-display font-bold text-sm" style="color:{cloud.tone};">{cloud.label}</div>
      <div class="text-xs tx-faint">
        {#if $syncStatus.mode === 'synced' && $syncStatus.lastSync}
          {(now, agoText($syncStatus.lastSync))} · all 6 phones share one board
        {:else if $syncStatus.mode === 'local'}
          Cloud unreachable — changes save on this phone only
        {:else}
          Everyone who opens the site sees & edits the same stats
        {/if}
      </div>
    </div>
    <button class="btn btn-ghost px-3 py-2 text-sm shrink-0" onclick={syncNow}>Sync now</button>
  </div>

  <div class="card space-y-1">
    <h3 class="font-display font-bold neon-text">Backup & Transfer</h3>
    <p class="text-sm tx-muted">
      Stats sync automatically across the group. You can also Export a
      <code class="tx">padel_stats.json</code> backup, or Import one to overwrite everywhere.
    </p>
  </div>

  <button class="btn btn-primary w-full" onclick={onExport}>⬇️ Export Data (padel_stats.json)</button>
  <button class="btn btn-ghost w-full" onclick={() => fileInput.click()}>⬆️ Import Data (overwrite)</button>
  <input type="file" accept="application/json,.json" class="hidden" bind:this={fileInput} onchange={onFile} />

  <button class="btn btn-ghost w-full text-hot/90" style="border-color:rgba(255,94,58,0.3);"
          onclick={openReset}>♻️ Reset all stats</button>

  {#if toast}
    <div class="fixed bottom-24 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 text-sm font-medium z-50"
         transition:fade style="border-color:rgba(16,185,129,0.4);">{toast}</div>
  {/if}

  <!-- Import confirm -->
  {#if confirmImport}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" transition:fade>
      <div class="glass rounded-3xl p-5 w-full max-w-sm space-y-3 text-center">
        <div class="text-3xl">⚠️</div>
        <h3 class="font-display font-bold">Overwrite local data?</h3>
        <p class="text-sm tx-muted">
          This replaces your current stats with the imported file
          ({confirmImport.players.length} players, {confirmImport.matches.length} matches).
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-ghost" onclick={() => (confirmImport = null)}>Cancel</button>
          <button class="btn btn-primary" onclick={applyImport}>Overwrite</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Reset confirm -->
  {#if confirmReset}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" transition:fade>
      <div class="glass rounded-3xl p-5 w-full max-w-sm space-y-3 text-center">
        <div class="text-3xl">♻️</div>
        <h3 class="font-display font-bold">Reset everything?</h3>
        <p class="text-sm tx-muted">Wipes all matches and stats back to the 6 original players. Can't be undone.</p>
        <input class="input text-center" type="password" inputmode="numeric" placeholder="Enter PIN" autocomplete="off"
               bind:value={resetPin} onkeydown={(e) => e.key === 'Enter' && doReset()} />
        {#if resetPinError}<p class="text-sm text-hot">{resetPinError}</p>{/if}
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-ghost" onclick={closeReset}>Cancel</button>
          <button class="btn btn-primary" style="background:linear-gradient(180deg,#ff8a6a,#ff5e3a);" onclick={doReset}>Reset</button>
        </div>
      </div>
    </div>
  {/if}
</div>
