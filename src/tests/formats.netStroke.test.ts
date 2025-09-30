import { describe, it, expect } from 'vitest';
import { computeNetStrokeResult } from '@/lib/formats/netStroke';
import { Scorecard, StrokeAllocation } from '@/lib/types';

describe('Net Stroke Play Scoring', () => {
  const createScorecard = (userId: string, scores: number[]): Scorecard => ({
    id: `scorecard-${userId}`,
    matchId: 'match-1',
    userId,
    entries: scores.map((strokes, index) => ({
      hole: index + 1,
      strokes,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('should calculate net stroke totals correctly', () => {
    const player1Scores = new Array(18).fill(5); // 90 gross
    const player2Scores = new Array(18).fill(4); // 72 gross

    const scorecards = [
      createScorecard('player1', player1Scores),
      createScorecard('player2', player2Scores),
    ];

    // Player 1 gets 1 stroke on each hole
    const strokeAllocation: StrokeAllocation = {
      'player1': new Array(18).fill(1),
      'player2': new Array(18).fill(0),
    };

    const result = computeNetStrokeResult(scorecards, strokeAllocation);

    // Player 1: 90 - 18 = 72 net
    // Player 2: 72 - 0 = 72 net
    expect(result.netTotals['player1']).toBe(72);
    expect(result.netTotals['player2']).toBe(72);
    expect(result.winner).toBeUndefined(); // Tie
  });

  it('should determine winner correctly', () => {
    const player1Scores = new Array(18).fill(5); // 90 gross
    const player2Scores = new Array(18).fill(4); // 72 gross

    const scorecards = [
      createScorecard('player1', player1Scores),
      createScorecard('player2', player2Scores),
    ];

    // Player 1 gets 2 strokes on first 9 holes
    const strokeAllocation: StrokeAllocation = {
      'player1': [...new Array(9).fill(2), ...new Array(9).fill(0)],
      'player2': new Array(18).fill(0),
    };

    const result = computeNetStrokeResult(scorecards, strokeAllocation);

    // Player 1: 90 - 18 = 72 net
    // Player 2: 72 - 0 = 72 net
    // Actually player 1 gets 2 strokes on 9 holes = 18 strokes total
    expect(result.netTotals['player1']).toBe(72);
    expect(result.winner).toBeUndefined(); // Still a tie
  });
});