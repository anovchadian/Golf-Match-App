/**
 * Skins game scoring engine
 */

import { Scorecard, StrokeAllocation, SkinsResult } from '../types';

export function computeSkins(
  scorecards: Scorecard[],
  strokeAllocation: StrokeAllocation
): SkinsResult {
  const holes: { hole: number; winner?: string; carryover: number }[] = [];
  const winners: { [userId: string]: number } = {};
  let carryover = 1;

  // Initialize winners count
  scorecards.forEach(sc => {
    winners[sc.userId] = 0;
  });

  for (let hole = 1; hole <= 18; hole++) {
    const netScores: { userId: string; netScore: number }[] = [];

    scorecards.forEach(scorecard => {
      const entry = scorecard.entries.find(e => e.hole === hole);
      if (entry) {
        const strokes = strokeAllocation[scorecard.userId]?.[hole - 1] || 0;
        const netScore = entry.strokes - strokes;
        netScores.push({ userId: scorecard.userId, netScore });
      }
    });

    if (netScores.length === 0) continue;

    // Find lowest net score
    const lowestScore = Math.min(...netScores.map(s => s.netScore));
    const winnersThisHole = netScores.filter(s => s.netScore === lowestScore);

    if (winnersThisHole.length === 1) {
      // Clear winner
      const winner = winnersThisHole[0].userId;
      winners[winner] += carryover;
      holes.push({ hole, winner, carryover });
      carryover = 1;
    } else {
      // Tie - carry over to next hole
      holes.push({ hole, carryover });
      carryover++;
    }
  }

  return { holes, winners };
}