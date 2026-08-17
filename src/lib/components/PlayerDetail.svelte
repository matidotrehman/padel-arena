<script>
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Crown, Zap, Shield, Target } from '@lucide/svelte';
  import { headToHead, record, totalEncounters } from '../logic/h2h.js';
  import { winRate, avgPoints, pointDiff, form } from '../logic/stats.js';
  import { computePlayerAchievements } from '../logic/achievements.js';
  import Avatar from './Avatar.svelte';

  let { player, players, matches, onclose } = $props();

  const FORM_TONE_COLOR = {
    hot: 'var(--color-hot)',
    up: 'var(--accent-fg)',
    ice: 'var(--color-ice)',
    down: 'var(--tx-muted)',
    neutral: 'var(--tx-faint)',
  };

  const h2h = $derived(headToHead(matches));
  const f = $derived(form(player));
  const achs = $derived(computePlayerAchievements(player, players, matches));

  const rows = $derived(
    players
      .filter((p) => p.id !== player.id)
      .map((q) => {
        const rec = record(h2h, player.id, q.id);
        return { q, rec, total: totalEncounters(rec), oppGames: rec.oppW + rec.oppL, diff: rec.oppPF - rec.oppPA };
      })
      .sort((a, b) => b.total - a.total || a.q.name.localeCompare(b.q.name))
  );
  const archetype = $derived.by(() => {
    const wr = winRate(player);
    const pd = pointDiff(player);
    if (wr >= 65) return { title: 'Apex Competitor', icon: Crown, tag: 'Dominant Win Rate' };
    if (pd > 15) return { title: 'Smash Powerhouse', icon: Zap, tag: 'High Point Differential' };
    if (player.wins >= player.losses) return { title: 'Court General', icon: Shield, tag: 'Consistent Performer' };
    return { title: 'The Challenger', icon: Target, tag: 'Rising Contender' };
  });
  const ArchetypeIcon = $derived(archetype.icon);
</script>

<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 backdrop-blur-sm"
     style="background:var(--scrim);"
     transition:fade={{ duration: 150, easing: cubicOut }}
     onclick={(e) => { if (e.target === e.currentTarget) onclose(); }} role="presentation">
  <div class="glass rounded-[var(--radius-lg)] w-full max-w-md max-h-[85dvh] overflow-y-auto p-5 space-y-4"
       transition:fly={{ y: 30, duration: 250, easing: cubicOut }} role="dialog" aria-modal="true" tabindex="-1">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Avatar {player} size={54} />
      <div class="min-w-0 flex-1">
        <div class="h-display font-extrabold text-xl truncate tx flex items-center gap-1.5">
          <span>{player.name}</span>
          <f.icon size={14} strokeWidth={2.5} color={FORM_TONE_COLOR[f.tone]} />
        </div>
        <div class="text-xs font-semibold neon-text leading-tight flex items-center gap-1">
          <ArchetypeIcon size={12} strokeWidth={2.25} />
          {archetype.title}
        </div>
        <div class="text-[11px] tx-muted mono mt-0.5">
          {player.matchesPlayed} games · {player.wins}W {player.losses}L ({winRate(player)}%)
        </div>
      </div>
      <div class="text-right shrink-0">
        <div class="mono font-extrabold text-2xl neon-text leading-none">{avgPoints(player)}</div>
        <div class="text-[9px] uppercase tracking-widest tx-faint font-bold">pts / game</div>
      </div>
    </div>

    <!-- Career Achievements -->
    {#if achs.unlocked.length}
      <div class="glass rounded-[var(--radius-md)] p-2.5 space-y-1" style="border-color:color-mix(in srgb, var(--accent-fg) 20%, transparent);">
        <div class="text-[10px] font-bold uppercase tracking-wider tx-faint flex items-center justify-between">
          <span>Career Achievements</span>
          <span class="mono" style="color:var(--accent-fg);">{achs.count}/{achs.total} Unlocked</span>
        </div>
        <div class="flex flex-wrap gap-1">
          {#each achs.unlocked as ach (ach.id)}
            <span
              class="chip !px-2 !py-0.5 text-[11px]"
              style="background:color-mix(in srgb, var(--accent-fg) 10%, transparent);color:var(--accent-fg);border:1px solid color-mix(in srgb, var(--accent-fg) 30%, transparent);"
              title={ach.description}
            >
              <ach.icon size={11} strokeWidth={2.5} /> {ach.title}
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <div>
      <div class="label !mb-1">Head-to-head</div>
      <p class="text-[11px] tx-faint leading-snug">
        <b class="tx-muted">Against</b> = when you played them (win–loss + point difference).
        <b class="tx-muted">With</b> = when you were partners.
      </p>
    </div>

    <!-- Column headers -->
    <div class="flex items-center gap-2 px-3 text-[10px] uppercase tracking-wider tx-faint font-bold">
      <span class="w-[30px]"></span>
      <span class="flex-1">Player</span>
      <span class="w-[74px] text-center">Against</span>
      <span class="w-[52px] text-center">With</span>
    </div>

    <!-- Rows -->
    <div class="space-y-1.5">
      {#each rows as { q, rec, total, oppGames, diff } (q.id)}
        <div class="glass rounded-[var(--radius-md)] pl-3 pr-2 py-2 flex items-center gap-2">
          <Avatar player={q} size={30} />
          <span class="flex-1 truncate text-sm font-medium tx">{q.name}</span>

          {#if total === 0}
            <span class="tx-faint text-xs italic pr-2">not yet</span>
          {:else}
            <!-- Against -->
            <div class="w-[74px] text-center leading-tight">
              {#if oppGames > 0}
                <div class="mono font-bold text-[15px]"
                     style={rec.oppW > rec.oppL ? 'color:var(--accent-fg);' : rec.oppW < rec.oppL ? 'color:var(--color-hot);' : 'color:var(--tx);'}>{rec.oppW}–{rec.oppL}</div>
                <div class="text-[10px] mono" style={diff >= 0 ? 'color:var(--accent-fg);' : 'color:var(--color-hot);'}>
                  {diff >= 0 ? '+' : ''}{diff}
                </div>
              {:else}
                <span class="tx-faint">–</span>
              {/if}
            </div>
            <!-- With -->
            <div class="w-[52px] text-center">
              {#if rec.partW + rec.partL > 0}
                <span class="mono font-bold text-[15px] tx">{rec.partW}–{rec.partL}</span>
              {:else}
                <span class="tx-faint">–</span>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <button class="btn btn-ghost w-full" onclick={onclose}>Close</button>
  </div>
</div>
