// Pure logic for Radar attributes, Duo Matrix, and Form Timelines.

import { winRate, pointDiff } from './stats.js';

// Helper to extract player matches in chronological order
export function getPlayerMatches(playerId, matches = []) {
  const ordered = [...matches].sort((a, b) => (a.date || 0) - (b.date || 0));
  return ordered.filter((m) => {
    if (m.mode === 'fixed') {
      return (m.teamA || []).includes(playerId) || (m.teamB || []).includes(playerId);
    }
    if (m.mode === 'individual') {
      return (m.entries || []).some((e) => e.id === playerId);
    }
    if (m.mode === 'americano') {
      return (m.rounds || []).some(
        (r) => (r.teamA || []).includes(playerId) || (r.teamB || []).includes(playerId)
      );
    }
    return false;
  });
}

// 1. Radar Attributes (0 - 100 scale)
export function computeRadarMetrics(player, matches = []) {
  if (!player || !player.matchesPlayed) {
    return {
      power: 40,
      clutch: 50,
      dominance: 50,
      form: 50,
      versatility: 50,
      matchesPlayed: 0,
    };
  }

  const pMatches = getPlayerMatches(player.id, matches);

  // Power = Win Rate %
  const power = winRate(player);

  // Dominance = Avg point differential per match mapped to 0-100 scale (-5 to +5 range mapped to 0-100)
  const avgDiff = player.matchesPlayed ? pointDiff(player) / player.matchesPlayed : 0;
  const dominance = Math.max(0, Math.min(100, Math.round(50 + avgDiff * 10)));

  // Form = Win rate in the last 5 matches
  const recentResults = (player.results || []).slice(-5);
  const recentWins = recentResults.filter((r) => r === 'W').length;
  const form = recentResults.length ? Math.round((recentWins / recentResults.length) * 100) : 50;

  // Clutch & Versatility
  let clutchWins = 0;
  let clutchTotal = 0;
  const partnerStats = {};

  for (const m of pMatches) {
    let pTeam = [];
    let isWin = false;
    let isClutch = false;

    if (m.mode === 'fixed') {
      const inA = (m.teamA || []).includes(player.id);
      pTeam = inA ? m.teamA : m.teamB;
      const scoreA = m.scoreA ?? 0;
      const scoreB = m.scoreB ?? 0;
      isWin = inA ? scoreA > scoreB : scoreB > scoreA;
      if (Math.abs(scoreA - scoreB) <= 2) isClutch = true;
    } else if (m.mode === 'individual') {
      isWin = (m.winnerIds || []).includes(player.id);
      const entry = (m.entries || []).find((e) => e.id === player.id);
      const topPts = Math.max(...(m.entries || []).map((e) => e.pts || 0));
      if (entry && topPts - entry.pts <= 3) isClutch = true;
    } else if (m.mode === 'americano') {
      for (const r of m.rounds || []) {
        const inA = (r.teamA || []).includes(player.id);
        const inB = (r.teamB || []).includes(player.id);
        if (!inA && !inB) continue;
        pTeam = inA ? r.teamA : r.teamB;
        const scoreA = r.scoreA ?? 0;
        const scoreB = r.scoreB ?? 0;
        isWin = inA ? scoreA > scoreB : scoreB > scoreA;
        if (Math.abs(scoreA - scoreB) <= 3) isClutch = true;

        if (isClutch) {
          clutchTotal++;
          if (isWin) clutchWins++;
        }

        const partnerId = pTeam.find((id) => id !== player.id);
        if (partnerId) {
          if (!partnerStats[partnerId]) partnerStats[partnerId] = { wins: 0, total: 0 };
          partnerStats[partnerId].total++;
          if (isWin) partnerStats[partnerId].wins++;
        }
      }
      continue;
    }

    if (isClutch) {
      clutchTotal++;
      if (isWin) clutchWins++;
    }

    const partnerId = pTeam.find((id) => id !== player.id);
    if (partnerId) {
      if (!partnerStats[partnerId]) partnerStats[partnerId] = { wins: 0, total: 0 };
      partnerStats[partnerId].total++;
      if (isWin) partnerStats[partnerId].wins++;
    }
  }

  const clutch = clutchTotal > 0 ? Math.round((clutchWins / clutchTotal) * 100) : 50;

  const partnerRates = Object.values(partnerStats)
    .filter((s) => s.total >= 1)
    .map((s) => (s.wins / s.total) * 100);

  let versatility = 50;
  if (partnerRates.length >= 2) {
    const mean = partnerRates.reduce((a, b) => a + b, 0) / partnerRates.length;
    const variance =
      partnerRates.reduce((acc, rate) => acc + Math.pow(rate - mean, 2), 0) / partnerRates.length;
    const stdDev = Math.sqrt(variance);
    versatility = Math.max(20, Math.min(100, Math.round(90 - stdDev * 1.2)));
  } else if (partnerRates.length === 1) {
    versatility = 60;
  }

  return {
    power,
    clutch,
    dominance,
    form,
    versatility,
    matchesPlayed: player.matchesPlayed,
  };
}

// 2. Full Duo Matrix
export function computeFullDuoMatrix(players = [], matches = []) {
  const matrix = {};
  for (const p1 of players) {
    matrix[p1.id] = {};
    for (const p2 of players) {
      matrix[p1.id][p2.id] = {
        partnerWins: 0,
        partnerLosses: 0,
        partnerPtsFor: 0,
        partnerPtsAgainst: 0,
        vsWins: 0,
        vsLosses: 0,
      };
    }
  }

  for (const m of matches) {
    if (m.mode === 'fixed') {
      const scoreA = m.scoreA ?? 0;
      const scoreB = m.scoreB ?? 0;
      const winA = scoreA > scoreB;

      if (m.teamA?.length === 2) {
        const [a1, a2] = m.teamA;
        if (matrix[a1]?.[a2]) {
          if (winA) {
            matrix[a1][a2].partnerWins++;
            matrix[a2][a1].partnerWins++;
          } else {
            matrix[a1][a2].partnerLosses++;
            matrix[a2][a1].partnerLosses++;
          }
          matrix[a1][a2].partnerPtsFor += scoreA;
          matrix[a2][a1].partnerPtsFor += scoreA;
          matrix[a1][a2].partnerPtsAgainst += scoreB;
          matrix[a2][a1].partnerPtsAgainst += scoreB;
        }
      }
      if (m.teamB?.length === 2) {
        const [b1, b2] = m.teamB;
        if (matrix[b1]?.[b2]) {
          if (!winA) {
            matrix[b1][b2].partnerWins++;
            matrix[b2][b1].partnerWins++;
          } else {
            matrix[b1][b2].partnerLosses++;
            matrix[b2][b1].partnerLosses++;
          }
          matrix[b1][b2].partnerPtsFor += scoreB;
          matrix[b2][b1].partnerPtsFor += scoreB;
          matrix[b1][b2].partnerPtsAgainst += scoreA;
          matrix[a2]?.[a1] ? (matrix[b2][b1].partnerPtsAgainst += scoreA) : null;
        }
      }

      for (const a of m.teamA || []) {
        for (const b of m.teamB || []) {
          if (matrix[a]?.[b]) {
            if (winA) {
              matrix[a][b].vsWins++;
              matrix[b][a].vsLosses++;
            } else {
              matrix[a][b].vsLosses++;
              matrix[b][a].vsWins++;
            }
          }
        }
      }
    } else if (m.mode === 'americano') {
      for (const r of m.rounds || []) {
        const scoreA = r.scoreA ?? 0;
        const scoreB = r.scoreB ?? 0;
        const winA = scoreA > scoreB;

        if (r.teamA?.length === 2) {
          const [a1, a2] = r.teamA;
          if (matrix[a1]?.[a2]) {
            if (winA) {
              matrix[a1][a2].partnerWins++;
              matrix[a2][a1].partnerWins++;
            } else {
              matrix[a1][a2].partnerLosses++;
              matrix[a2][a1].partnerLosses++;
            }
            matrix[a1][a2].partnerPtsFor += scoreA;
            matrix[a2][a1].partnerPtsFor += scoreA;
            matrix[a1][a2].partnerPtsAgainst += scoreB;
            matrix[a2][a1].partnerPtsAgainst += scoreB;
          }
        }
        if (r.teamB?.length === 2) {
          const [b1, b2] = r.teamB;
          if (matrix[b1]?.[b2]) {
            if (!winA) {
              matrix[b1][b2].partnerWins++;
              matrix[b2][b1].partnerWins++;
            } else {
              matrix[b1][b2].partnerLosses++;
              matrix[b2][b1].partnerLosses++;
            }
            matrix[b1][b2].partnerPtsFor += scoreB;
            matrix[b2][b1].partnerPtsFor += scoreB;
            matrix[b1][b2].partnerPtsAgainst += scoreA;
            matrix[b2][b1].partnerPtsAgainst += scoreA;
          }
        }

        for (const a of r.teamA || []) {
          for (const b of r.teamB || []) {
            if (matrix[a]?.[b]) {
              if (winA) {
                matrix[a][b].vsWins++;
                matrix[b][a].vsLosses++;
              } else {
                matrix[a][b].vsLosses++;
                matrix[b][a].vsWins++;
              }
            }
          }
        }
      }
    }
  }

  return matrix;
}

// 3. Form Timeline Progression
export function computeFormTimeline(players = [], matches = []) {
  const ordered = [...matches].sort((a, b) => (a.date || 0) - (b.date || 0));

  const statsByPlayer = {};
  for (const p of players) {
    statsByPlayer[p.id] = { wins: 0, matches: 0, points: 0, history: [] };
  }

  const timelinePoints = [];

  ordered.forEach((m, idx) => {
    for (const p of players) {
      const pid = p.id;
      let played = false;
      let won = false;
      let ptsWon = 0;

      if (m.mode === 'fixed') {
        const inA = (m.teamA || []).includes(pid);
        const inB = (m.teamB || []).includes(pid);
        if (inA || inB) {
          played = true;
          const scoreA = m.scoreA ?? 0;
          const scoreB = m.scoreB ?? 0;
          won = inA ? scoreA > scoreB : scoreB > scoreA;
          ptsWon = inA ? scoreA : scoreB;
        }
      } else if (m.mode === 'individual') {
        const entry = (m.entries || []).find((e) => e.id === pid);
        if (entry) {
          played = true;
          won = (m.winnerIds || []).includes(pid);
          ptsWon = entry.pts || 0;
        }
      } else if (m.mode === 'americano') {
        let aPlayed = false;
        let aWins = 0;
        let aPts = 0;
        for (const r of m.rounds || []) {
          const inA = (r.teamA || []).includes(pid);
          const inB = (r.teamB || []).includes(pid);
          if (inA || inB) {
            aPlayed = true;
            const scoreA = r.scoreA ?? 0;
            const scoreB = r.scoreB ?? 0;
            const rWon = inA ? scoreA > scoreB : scoreB > scoreA;
            if (rWon) aWins++;
            aPts += inA ? scoreA : scoreB;
          }
        }
        if (aPlayed) {
          played = true;
          won = aWins > (m.rounds?.length || 0) / 2;
          ptsWon = aPts;
        }
      }

      if (played) {
        statsByPlayer[pid].matches += 1;
        if (won) statsByPlayer[pid].wins += 1;
        statsByPlayer[pid].points += ptsWon;
      }

      const currentWinRate = statsByPlayer[pid].matches
        ? Math.round((statsByPlayer[pid].wins / statsByPlayer[pid].matches) * 100)
        : 0;

      statsByPlayer[pid].history.push({
        matchIdx: idx + 1,
        date: m.date || Date.now(),
        winRate: currentWinRate,
        totalMatches: statsByPlayer[pid].matches,
        totalPoints: statsByPlayer[pid].points,
      });
    }

    const snapshot = { matchIdx: idx + 1, date: m.date || Date.now(), rates: {} };
    for (const p of players) {
      const h = statsByPlayer[p.id].history;
      snapshot.rates[p.id] = h[h.length - 1]?.winRate ?? 0;
    }
    timelinePoints.push(snapshot);
  });

  return { timelinePoints, statsByPlayer };
}
