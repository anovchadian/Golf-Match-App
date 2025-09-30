/**
 * Handicap calculation utilities
 * All calculations are deterministic and follow USGA standards
 */

import { MatchFormat } from './types';

/**
 * Calculate Course Handicap
 * Formula: round(HI × (Slope / 113) + (CR - Par))
 */
export function calcCourseHandicap(
  handicapIndex: number,
  slope: number,
  rating: number,
  par: number
): number {
  return Math.round(handicapIndex * (slope / 113) + (rating - par));
}

/**
 * Calculate Playing Handicap based on format
 * Singles Match Play: 100% of Course Handicap
 * Net Stroke Play: 95% of Course Handicap
 */
export function calcPlayingHandicap(
  courseHandicap: number,
  format: MatchFormat
): number {
  const percentage = format === 'match_play_net' ? 1.0 : 0.95;
  return Math.round(courseHandicap * percentage);
}

/**
 * Allocate strokes across holes based on stroke index
 * Returns strokes per hole for each player relative to the lowest handicap
 */
export function allocateStrokes(
  playerHandicaps: { [userId: string]: number },
  strokeIndex: number[]
): { [userId: string]: number[] } {
  if (strokeIndex.length !== 18) {
    throw new Error('Stroke index must have exactly 18 values');
  }

  const userIds = Object.keys(playerHandicaps);
  const lowestHandicap = Math.min(...Object.values(playerHandicaps));

  const allocation: { [userId: string]: number[] } = {};

  userIds.forEach(userId => {
    const strokeDiff = playerHandicaps[userId] - lowestHandicap;
    const strokes = new Array(18).fill(0);

    // Distribute strokes based on stroke index
    for (let i = 0; i < strokeDiff; i++) {
      const holeIndex = i % 18;
      // Find the hole with this stroke index
      const targetStrokeIndex = (i % 18) + 1;
      const actualHoleIndex = strokeIndex.indexOf(targetStrokeIndex);
      if (actualHoleIndex !== -1) {
        strokes[actualHoleIndex]++;
      }
    }

    allocation[userId] = strokes;
  });

  return allocation;
}

/**
 * Get full handicap calculation for a player
 */
export function calculatePlayerHandicap(
  handicapIndex: number,
  slope: number,
  rating: number,
  par: number,
  format: MatchFormat
) {
  const courseHandicap = calcCourseHandicap(handicapIndex, slope, rating, par);
  const playingHandicap = calcPlayingHandicap(courseHandicap, format);

  return {
    handicapIndex,
    courseHandicap,
    playingHandicap,
  };
}