/**
 * Net Stroke Play scoring engine
 */

import { Scorecard, StrokeAllocation, NetStrokeResult } from '../types';

export function computeNetStrokeResult(
  scorecards: Scorecard[],
  strokeAllocation: StrokeAllocation
): NetStrokeResult {
  const netTotals: { [userId: string]: number } = {};

  scorecards.forEach(scorecard => {
    let total = 0;
    scorecard.entries.forEach(entry => {
      const strokes = strokeAllocation[scorecard.userId]?.[entry.hole - 1] || 0;
      const netScore = entry.strokes - strokes;
      total += netScore;
    });
    netTotals[scorecard.userId] = total;
  });

  // Find winner (lowest net score)
  let winner: string | undefined;
  let lowestScore = Infinity;
  Object.entries(netTotals).forEach(([userId, score]) => {
    if (score < lowestScore) {
      lowestScore = score;
      winner = userId;
    } else if (score === lowestScore) {
      winner = undefined; // Tie
    }
  });

  return {
    netTotals,
    winner,
  };
}