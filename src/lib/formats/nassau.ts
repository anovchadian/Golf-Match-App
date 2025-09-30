/**
 * Nassau scoring engine (front 9, back 9, overall)
 */

import { Scorecard, StrokeAllocation, NassauResult } from '../types';

export function computeNassau(
  scorecards: Scorecard[],
  strokeAllocation: StrokeAllocation,
  stakesCents: number
): NassauResult {
  if (scorecards.length !== 2) {
    throw new Error('Nassau requires exactly 2 players');
  }

  const [player1, player2] = scorecards;
  const nassauStake = Math.floor(stakesCents / 3); // Divide stakes into 3 parts

  // Calculate front 9
  const front = calculateNineHoles(player1, player2, strokeAllocation, 1, 9, nassauStake);
  
  // Calculate back 9
  const back = calculateNineHoles(player1, player2, strokeAllocation, 10, 18, nassauStake);

  // Calculate overall 18
  const overall = calculateNineHoles(player1, player2, strokeAllocation, 1, 18, nassauStake);

  return { front, back, overall };
}

function calculateNineHoles(
  player1: Scorecard,
  player2: Scorecard,
  strokeAllocation: StrokeAllocation,
  startHole: number,
  endHole: number,
  amount: number
): { winner?: string; amount: number } {
  let p1Total = 0;
  let p2Total = 0;

  for (let hole = startHole; hole <= endHole; hole++) {
    const p1Entry = player1.entries.find(e => e.hole === hole);
    const p2Entry = player2.entries.find(e => e.hole === hole);

    if (p1Entry && p2Entry) {
      const p1Strokes = strokeAllocation[player1.userId]?.[hole - 1] || 0;
      const p2Strokes = strokeAllocation[player2.userId]?.[hole - 1] || 0;

      p1Total += p1Entry.strokes - p1Strokes;
      p2Total += p2Entry.strokes - p2Strokes;
    }
  }

  let winner: string | undefined;
  if (p1Total < p2Total) {
    winner = player1.userId;
  } else if (p2Total < p1Total) {
    winner = player2.userId;
  }

  return { winner, amount };
}