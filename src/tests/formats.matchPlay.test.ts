import { describe, it, expect } from 'vitest';
import { computeMatchPlayResult } from '@/lib/formats/matchPlay';
import { Scorecard, StrokeAllocation } from '@/lib/types';

describe('Match Play Scoring', () => {
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

  it('should calculate match play result correctly', () => {
    const player1Scores = [4, 5, 3, 4, 5, 4, 3, 5, 4, 4, 5, 3, 4, 5, 4, 3, 5, 4];
    const player2Scores = [5, 4, 4, 3, 5, 5, 4, 4, 5, 5, 4, 4, 3, 5, 5, 4, 4, 5];

    const scorecards = [
      createScorecard('player1', player1Scores),
      createScorecard('player2', player2Scores),
    ];

    const strokeAllocation: StrokeAllocation = {
      'player1': [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
      'player2': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    const result = computeMatchPlayResult(scorecards, strokeAllocation);

    expect(result.holes).toHaveLength(18);
    expect(result.winner).toBeDefined();
    expect(result.upDownHistory).toHaveLength(18);
  });

  it('should handle ties correctly', () => {
    const player1Scores = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    const player2Scores = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

    const scorecards = [
      createScorecard('player1', player1Scores),
      createScorecard('player2', player2Scores),
    ];

    const strokeAllocation: StrokeAllocation = {
      'player1': new Array(18).fill(0),
      'player2': new Array(18).fill(0),
    };

    const result = computeMatchPlayResult(scorecards, strokeAllocation);

    expect(result.winner).toBeUndefined();
    expect(result.upDownHistory[17]).toBe(0);
  });

  it('should throw error for non-2-player match', () => {
    const scorecards = [createScorecard('player1', new Array(18).fill(4))];
    const strokeAllocation: StrokeAllocation = {
      'player1': new Array(18).fill(0),
    };

    expect(() => {
      computeMatchPlayResult(scorecards, strokeAllocation);
    }).toThrow('Match play requires exactly 2 players');
  });
});