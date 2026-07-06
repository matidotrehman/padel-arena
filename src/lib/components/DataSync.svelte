<script>
  import { fade } from 'svelte/transition';
  import { exportState, parseImport } from '../logic/persistence.js';
  import { currentState, replaceState, resetAll } from '../stores/store.js';

  let fileInput;
  let toast = $state('');
  let confirmImport = $state(null); // parsed pending state
  let confirmReset = $state(false);

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

  function doReset() {
    resetAll();
    confirmReset = false;
    flash('Reset to the 6 originals ✓');
  }
</script>

<div class="space-y-3">
  <div class="card space-y-1">
    <h3 class="font-display font-bold neon-text">Data Sync</h3>
    <p class="text-sm text-white/55">
      No server, no accounts. Everything lives on this phone. Export to back up or share the
      group's stats to another device, then Import there to sync.
    </p>
  </div>

  <button class="btn btn-primary w-full" onclick={onExport}>⬇️ Export Data (padel_stats.json)</button>
  <button class="btn btn-ghost w-full" onclick={() => fileInput.click()}>⬆️ Import Data (overwrite)</button>
  <input type="file" accept="application/json,.json" class="hidden" bind:this={fileInput} onchange={onFile} />

  <button class="btn btn-ghost w-full text-hot/90" style="border-color:rgba(255,94,58,0.3);"
          onclick={() => (confirmReset = true)}>♻️ Reset all stats</button>

  {#if toast}
    <div class="fixed bottom-24 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 text-sm font-medium z-50"
         transition:fade style="border-color:rgba(182,255,46,0.4);">{toast}</div>
  {/if}

  <!-- Import confirm -->
  {#if confirmImport}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" transition:fade>
      <div class="glass rounded-3xl p-5 w-full max-w-sm space-y-3 text-center">
        <div class="text-3xl">⚠️</div>
        <h3 class="font-display font-bold">Overwrite local data?</h3>
        <p class="text-sm text-white/55">
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
        <p class="text-sm text-white/55">Wipes all matches and stats back to the 6 original players. Can't be undone.</p>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-ghost" onclick={() => (confirmReset = false)}>Cancel</button>
          <button class="btn btn-primary" style="background:linear-gradient(180deg,#ff8a6a,#ff5e3a);" onclick={doReset}>Reset</button>
        </div>
      </div>
    </div>
  {/if}
</div>
