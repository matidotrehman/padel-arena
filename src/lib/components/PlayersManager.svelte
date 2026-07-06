<script>
  import { fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { players, addPlayer, renamePlayer, removePlayer, setPlayerColor, NEON_PALETTE } from '../stores/store.js';
  import Avatar from './Avatar.svelte';

  let newName = $state('');
  let editingId = $state(null);
  let editName = $state('');
  let confirmDelete = $state(null);

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
      <div class="glass rounded-xl px-3 py-2.5 space-y-2" animate:flip={{ duration: 300 }}>
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
            <button class="tx-muted px-2" onclick={() => startEdit(p)} aria-label="Rename">✎</button>
            <button class="tx-muted hover:text-hot px-2" onclick={() => (confirmDelete = p)} aria-label="Remove">🗑</button>
          {/if}
        </div>
        <!-- color picker -->
        <div class="flex gap-1.5 pl-12">
          {#each NEON_PALETTE as c}
            <button class="w-5 h-5 rounded-full transition" aria-label="color"
                    style="background:{c};{p.avatarColor === c ? 'outline:2px solid white;outline-offset:1px;' : 'opacity:0.5;'}"
                    onclick={() => setPlayerColor(p.id, c)}></button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if confirmDelete}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" transition:fly={{ y: 10 }}>
      <div class="glass rounded-3xl p-5 w-full max-w-sm space-y-3 text-center">
        <div class="text-3xl">🗑</div>
        <h3 class="font-display font-bold">Remove {confirmDelete.name}?</h3>
        <p class="text-sm tx-muted">Their lifetime stats will be deleted. Past matches stay in history.</p>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-ghost" onclick={() => (confirmDelete = null)}>Cancel</button>
          <button class="btn btn-primary" style="background:linear-gradient(180deg,#ff8a6a,#ff5e3a);"
                  onclick={() => { removePlayer(confirmDelete.id); confirmDelete = null; }}>Remove</button>
        </div>
      </div>
    </div>
  {/if}
</div>
