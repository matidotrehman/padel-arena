# 🎾 Padel Arena — Leaderboard & Americano Mixer

A sleek, neon dark-mode single-page app for tracking a padel group's stats and running
6-player Americano sessions. **No database, no server, no hosting costs** — all data lives
in the browser (LocalStorage) and syncs between phones via JSON export/import.

Built with **Svelte 5 + Vite + Tailwind CSS v4**.

## Features

- **Dynamic leaderboard** — matches, wins, losses, win rate %, points won, point differential,
  and live **form** (🔥 win streak / ❄️ slump), with animated rank changes (`flip` + `tweened`).
- **Two logging modes**
  - *Fixed Partners* — pick 2 vs 2, enter set scores.
  - *Individual* — credit points per player regardless of partner.
- **6-Player Americano Mixer** — generates a fair, balanced rotation (everyone partners
  everyone at least once; rest/play turns spread evenly). Live **Courtside Scoreboard** with a
  temporary session leaderboard, then a one-tap **merge into lifetime stats** + confetti 🎉.
- **Gamification badges** — The Smash Master, Silent Killer, El Gato, Choke Artist (flip cards).
- **Data Sync** — Export `padel_stats.json` and Import to move stats across devices.
- **Mobile-first**, installable-feeling UI for courtside data entry.

Pre-seeded with 6 players: **Ahmed, Mati, Hamza, Tayyab, Ali, Jan** (add/remove/rename anytime).

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs static site to dist/
npm run preview  # preview the production build
```

## Deploy (free static hosting)

The build is 100% static — drop the repo on either platform, no config needed:

- **Vercel** — import the repo; it auto-detects Vite (`vercel.json` included).
- **Netlify** — import the repo; `netlify.toml` sets build = `npm run build`, publish = `dist`.

Or drag-and-drop the `dist/` folder onto Netlify Drop.

## Data storage

State is a Svelte `writable` store mirrored to `localStorage` under the key `padel_stats`
(in-progress Americano sessions use `padel_session`). Everything is per-device; use
**Data → Export/Import** to sync the group's stats between phones.

## Project structure

```
src/
  App.svelte                  # shell + tab navigation
  app.css                     # Tailwind + neon theme tokens
  lib/
    stores/  store.js         # lifetime stats store + all mutations
             session.js       # live Americano session store
    logic/   persistence.js   # LocalStorage load/save/export/import + seed
             stats.js         # win rate, form, streaks, ranking
             badges.js        # badge computation
             americano.js     # 6-player fair schedule generator
             celebrate.js     # confetti
    components/  LeaderboardTable, PlayerRow, MatchLogger, AmericanoMixer,
                 RoundCard, BadgeCard, BadgesPanel, StatCard, DataSync,
                 PlayersManager, TabBar, Avatar
```
