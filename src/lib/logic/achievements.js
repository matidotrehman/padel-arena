// Personal Milestone & Achievement Engine for Padel Arena.

import { winRate, pointDiff, currentStreak } from './stats.js';

export const ACHIEVEMENTS = [
  {
    id: 'first_match',
    icon: '🎾',
    title: 'First Blood',
    description: 'Play your first padel match.',
    category: 'milestone',
    check: (p) => ({ unlocked: p.matchesPlayed >= 1, progress: Math.min(1, p.matchesPlayed), label: `${p.matchesPlayed}/1 games` }),
  },
  {
    id: 'first_win',
    icon: '🏆',
    title: "Winner's Circle",
    description: 'Win your first padel match.',
    category: 'milestone',
    check: (p) => ({ unlocked: p.wins >= 1, progress: Math.min(1, p.wins), label: `${p.wins}/1 wins` }),
  },
  {
    id: 'win_streak_3',
    icon: '🔥',
    title: 'On Fire',
    description: 'Achieve a 3-match win streak.',
    category: 'streak',
    check: (p) => {
      const s = currentStreak(p);
      const maxStreak = Math.max(0, s);
      return { unlocked: maxStreak >= 3, progress: Math.min(1, maxStreak / 3), label: `${maxStreak}/3 streak` };
    },
  },
  {
    id: 'win_streak_5',
    icon: '⚡',
    title: 'Unstoppable',
    description: 'Achieve a 5-match win streak.',
    category: 'streak',
    check: (p) => {
      const s = currentStreak(p);
      const maxStreak = Math.max(0, s);
      return { unlocked: maxStreak >= 5, progress: Math.min(1, maxStreak / 5), label: `${maxStreak}/5 streak` };
    },
  },
  {
    id: 'century_club',
    icon: '💯',
    title: 'Century Club',
    description: 'Score 100+ lifetime points.',
    category: 'points',
    check: (p) => ({
      unlocked: p.pointsWon >= 100,
      progress: Math.min(1, p.pointsWon / 100),
      label: `${p.pointsWon}/100 pts`,
    }),
  },
  {
    id: 'the_diplomat',
    icon: '🤝',
    title: 'The Diplomat',
    description: 'Partner with all 5 other friends in the group.',
    category: 'social',
    check: (p, players, matches) => {
      const otherPlayers = (players || []).filter((x) => x.id !== p.id);
      const partnersPlayed = new Set();

      for (const m of matches || []) {
        let pTeam = [];
        if (m.mode === 'fixed') {
          if ((m.teamA || []).includes(p.id)) pTeam = m.teamA;
          else if ((m.teamB || []).includes(p.id)) pTeam = m.teamB;
        } else if (m.mode === 'americano') {
          for (const r of m.rounds || []) {
            if ((r.teamA || []).includes(p.id)) pTeam = r.teamA;
            else if ((r.teamB || []).includes(p.id)) pTeam = r.teamB;
            for (const partnerId of pTeam) {
              if (partnerId !== p.id) partnersPlayed.add(partnerId);
            }
          }
          continue;
        }
        for (const partnerId of pTeam) {
          if (partnerId !== p.id) partnersPlayed.add(partnerId);
        }
      }

      const count = partnersPlayed.size;
      const target = Math.max(1, otherPlayers.length);
      return {
        unlocked: count >= target && target > 0,
        progress: target ? Math.min(1, count / target) : 0,
        label: `${count}/${target} partners`,
      };
    },
  },
  {
    id: 'clutch_master',
    icon: '🎯',
    title: 'Clutch Master',
    description: 'Win 3 close matches decided by 2 points or less.',
    category: 'skill',
    check: (p, players, matches) => {
      let clutchWins = 0;
      for (const m of matches || []) {
        if (m.mode === 'fixed') {
          const inA = (m.teamA || []).includes(p.id);
          const inB = (m.teamB || []).includes(p.id);
          if (!inA && !inB) continue;
          const scoreA = m.scoreA ?? 0;
          const scoreB = m.scoreB ?? 0;
          const won = inA ? scoreA > scoreB : scoreB > scoreA;
          if (won && Math.abs(scoreA - scoreB) <= 2) clutchWins++;
        }
      }
      return {
        unlocked: clutchWins >= 3,
        progress: Math.min(1, clutchWins / 3),
        label: `${clutchWins}/3 clutch wins`,
      };
    },
  },
  {
    id: 'king_of_hill',
    icon: '👑',
    title: 'King of the Hill',
    description: 'Reach rank #1 on the leaderboard.',
    category: 'rank',
    check: (p, players) => {
      if (!p.matchesPlayed) return { unlocked: false, progress: 0, label: 'Not ranked' };
      const sorted = [...(players || [])].sort((a, b) => winRate(b) - winRate(a) || pointDiff(b) - pointDiff(a));
      const rank = sorted.findIndex((x) => x.id === p.id) + 1;
      return {
        unlocked: rank === 1,
        progress: rank === 1 ? 1 : 0.5,
        label: rank === 1 ? 'Rank #1 👑' : `Current Rank #${rank}`,
      };
    },
  },
  {
    id: 'iron_wall',
    icon: '🛡️',
    title: 'Iron Wall',
    description: 'Concede 5 or fewer points in a match.',
    category: 'skill',
    check: (p, players, matches) => {
      let achieved = false;
      for (const m of matches || []) {
        if (m.mode === 'fixed') {
          const inA = (m.teamA || []).includes(p.id);
          const inB = (m.teamB || []).includes(p.id);
          if (!inA && !inB) continue;
          const scoreA = m.scoreA ?? 0;
          const scoreB = m.scoreB ?? 0;
          const conceded = inA ? scoreB : scoreA;
          if (conceded <= 5 && m.matchesPlayed !== 0) achieved = true;
        }
      }
      return { unlocked: achieved, progress: achieved ? 1 : 0, label: achieved ? 'Achieved 🛡️' : '0/1 match' };
    },
  },
  {
    id: 'escaped_spoon',
    icon: '🧹',
    title: 'Escaped the Spoon',
    description: 'Climb out of last place after playing 3+ matches.',
    category: 'rank',
    check: (p, players) => {
      if (p.matchesPlayed < 3) return { unlocked: false, progress: 0, label: 'Needs 3 games' };
      const sorted = [...(players || [])].sort((a, b) => winRate(b) - winRate(a) || pointDiff(b) - pointDiff(a));
      const rank = sorted.findIndex((x) => x.id === p.id) + 1;
      const isLast = rank === sorted.length;
      return {
        unlocked: !isLast,
        progress: !isLast ? 1 : 0,
        label: !isLast ? `Rank #${rank}` : 'Currently last',
      };
    },
  },
];

export function computePlayerAchievements(player, players = [], matches = []) {
  if (!player) return { unlocked: [], locked: [], total: ACHIEVEMENTS.length, count: 0, pct: 0 };

  const unlocked = [];
  const locked = [];

  for (const ach of ACHIEVEMENTS) {
    const res = ach.check(player, players, matches);
    const item = { ...ach, ...res };
    if (res.unlocked) unlocked.push(item);
    else locked.push(item);
  }

  const count = unlocked.length;
  const total = ACHIEVEMENTS.length;
  const pct = Math.round((count / total) * 100);

  return { unlocked, locked, total, count, pct };
}
