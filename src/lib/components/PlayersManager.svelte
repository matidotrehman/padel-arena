<script>
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { flip } from 'svelte/animate';
  import { Pencil, Trash2 } from '@lucide/svelte';
  import { players, addPlayer, renamePlayer, removePlayer, setPlayerColor, setPlayerIcon, ANIMAL_ICONS, NEON_PALETTE } from '../stores/store.js';
  import { checkPin } from '../logic/pin.js';
  import Avatar from './Avatar.svelte';

  let newName = $state('');
  let editingId = $state(null);
  let editName = $state('');
  let confirmDelete = $state(null);
  let deletePin = $state('');
  let deletePinError = $state('');

  function add() {
    if (!newName.trim()) return;
    addPlayer(newName);
    newName = '';
  }

  function startEdit(p) {
    editingId = p.id;
    editName = p.name;
  }
  function saveEdit() {
    if (editingId) renamePlayer(editingId, editName);
    editingId = null;
  }

  function openDelete(p) {
    deletePin = '';
    deletePinError = '';
    confirmDelete = p;
  }

  function closeDelete() {
    confirmDelete = null;
    deletePin = '';
    deletePinError = '';
  }

  async function doDelete() {
    if (!(await checkPin(deletePin))) {
      deletePinError = 'Incorrect PIN';
      return;
    }
    removePlayer(confirmDelete.id);
    closeDelete();
  }
</script>

<div class="space-y-3">
  <div class="card space-y-1">
    <h3 class="font-display font-bold neon-text">Roster</h3>
    <p class="text-sm tx-muted">The core 6 are pre-loaded. Add regulars or guests anytime.</p>
  </div>

  <div class="flex gap-2">
    <input class="input" placeholder="Add a player…" bind:value={newName}
           onkeydown={(e) => e.key === 'Enter' && add()} />
    <button class="btn btn-primary px-5" onclick={add}>+</button>
  </div>

  <div class="space-y-2">
    {#each $players as p (p.id)}
      <div class="glass rounded-[var(--radius-md)] px-3 py-2.5 space-y-2" animate:flip={{ duration: 300 }}>
        <div class="flex items-center gap-3">
          <Avatar player={p} size={36} />
          {#if editingId === p.id}
            <input class="input py-1.5 flex-1" bind:value={editName}
                   onkeydown={(e) => e.key === 'Enter' && saveEdit()} />
            <button class="btn btn-primary px-3 py-1.5 text-sm" onclick={saveEdit}>Save</button>
          {:else}
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{p.name}</div>
              <div class="text-xs tx-faint">{p.matchesPlayed} games · {p.wins}W {p.losses}L</div>
            </div>
            <button class="icon-btn tx-muted px-2" onclick={() => startEdit(p)} aria-label="Rename">
              <Pencil size={15} strokeWidth={2.25} />
            </button>
            <button class="icon-btn tx-muted px-2" onclick={() => openDelete(p)} aria-label="Remove">
              <Trash2 size={15} strokeWidth={2.25} />
            </button>
          {/if}
        </div>
        <!-- Icon & Color pickers -->
        <div class="space-y-1.5 pl-12 pt-1 border-t" style="border-color:var(--border);">
          <div class="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            <span class="text-[9px] tx-faint font-bold uppercase mr-1 shrink-0">Icon:</span>
            {#each ANIMAL_ICONS as ico}
              <button
                class="icon-swatch w-6 h-6 rounded-[var(--radius-sm)] text-xs grid place-items-center shrink-0 glass {p.avatarIcon === ico ? 'is-active' : 'opacity-50 hover:opacity-100'}"
                aria-label="select icon {ico}"
                onclick={() => setPlayerIcon(p.id, ico)}
              >
                {ico}
              </button>
            {/each}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[9px] tx-faint font-bold uppercase mr-1 shrink-0">Color:</span>
            {#each NEON_PALETTE as c}
              <button class="color-swatch w-4 h-4 rounded-full" aria-label="color"
                      style="background:{c};{p.avatarColor === c ? 'outline:2px solid var(--tx);outline-offset:1px;' : 'opacity:0.5;'}"
                      onclick={() => setPlayerColor(p.id, c)}></button>
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if confirmDelete}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style="background:var(--scrim);" transition:fly={{ y: 10, easing: cubicOut }}>
      <div class="glass rounded-[var(--radius-lg)] p-5 w-full max-w-sm space-y-3 text-center">
        <div class="flex justify-center" style="color:var(--color-hot);"><Trash2 size={28} strokeWidth={2} /></div>
        <h3 class="font-display font-bold">Remove {confirmDelete.name}?</h3>
        <p class="text-sm tx-muted">Their lifetime stats will be deleted. Past matches stay in history.</p>
        <input class="input text-center" type="password" inputmode="numeric" placeholder="Enter PIN" autocomplete="off"
               bind:value={deletePin} onkeydown={(e) => e.key === 'Enter' && doDelete()} />
        {#if deletePinError}<p class="text-sm" style="color:var(--color-hot);">{deletePinError}</p>{/if}
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-ghost" onclick={closeDelete}>Cancel</button>
          <button class="btn btn-primary" style="background:linear-gradient(180deg, color-mix(in srgb, var(--color-hot) 70%, white 20%), var(--color-hot));"
                  onclick={doDelete}>Remove</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .icon-btn {
    transition: color 150ms var(--ease-out-smooth), transform 150ms var(--ease-spring);
  }
  .icon-btn:hover {
    color: var(--color-hot);
  }
  .icon-btn:active {
    transform: scale(0.9);
  }
  .icon-swatch {
    transition: transform 150ms var(--ease-spring), background-color 150ms var(--ease-out-smooth), opacity 150ms var(--ease-out-smooth);
  }
  .icon-swatch:hover {
    transform: scale(1.08);
  }
  .icon-swatch:active {
    transform: scale(0.95);
  }
  .icon-swatch.is-active {
    box-shadow: inset 0 0 0 1px var(--accent-fg);
    background: color-mix(in srgb, var(--accent-fg) 18%, transparent);
    transform: scale(1.05);
  }
  .color-swatch {
    transition: transform 150ms var(--ease-spring), opacity 150ms var(--ease-out-smooth);
  }
  .color-swatch:hover {
    transform: scale(1.15);
  }
  .color-swatch:active {
    transform: scale(0.9);
  }
</style>
