/**
 * Match Play Net scoring engine
 */

import { Scorecard, StrokeAllocation, MatchPlayResult, HoleResult } from '../types';

export function computeMatchPlayResult(
  scorecards: Scorecard[],
  strokeAllocation: StrokeAllocation
): MatchPlayResult {
  if (scorecards.length !== 2) {
    throw new Error('Match play requires exactly 2 players');
  }

  const [player1, player2] = scorecards;
  const holes: HoleResult[] = [];
  const upDownHistory: number[] = [];
  let runningScore = 0;

  for (let hole = 1; hole <= 18; hole++) {
    const p1Entry = player1.entries.find(e => e.hole === hole);
    const p2Entry = player2.entries.find(e => e.hole === hole);

    if (!p1Entry || !p2Entry) {
      continue; // Skip incomplete holes
    }

    // Calculate net scores
    const p1Strokes = strokeAllocation[player1.userId]?.[hole - 1] || 0;
    const p2Strokes = strokeAllocation[player2.userId]?.[hole - 1] || 0;

    const p1Net = p1Entry.strokes - p1Strokes;
    const p2Net = p2Entry.strokes - p2Strokes;

    let result: 'W' | 'L' | 'P';
    if (p1Net < p2Net) {
      result = 'W';
      runningScore++;
    } else if (p1Net > p2Net) {
      result = 'L';
      runningScore--;
    } else {
      result = 'P';
    }

    holes.push({
      hole,
      result,
      netScore: p1Net,
    });

    upDownHistory.push(runningScore);
  }

  // Determine winner
  const finalScore = upDownHistory[upDownHistory.length - 1] || 0;
  let winner: string | undefined;
  if (finalScore > 0) {
    winner = player1.userId;
  } else if (finalScore < 0) {
    winner = player2.userId;
  }

  return {
    holes,
    winner,
    upDownHistory,
  };
}