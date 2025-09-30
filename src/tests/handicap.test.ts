import { describe, it, expect } from 'vitest';
import { calcCourseHandicap, calcPlayingHandicap, allocateStrokes } from '@/lib/handicap';

describe('Handicap Calculations', () => {
  describe('calcCourseHandicap', () => {
    it('should calculate course handicap correctly', () => {
      const hi = 12.4;
      const slope = 145;
      const rating = 75.5;
      const par = 72;

      const ch = calcCourseHandicap(hi, slope, rating, par);
      
      // Expected: round(12.4 * (145 / 113) + (75.5 - 72))
      // = round(12.4 * 1.283 + 3.5)
      // = round(15.91 + 3.5)
      // = round(19.41)
      // = 19
      expect(ch).toBe(19);
    });

    it('should handle negative course rating adjustment', () => {
      const hi = 8.0;
      const slope = 130;
      const rating = 70.0;
      const par = 72;

      const ch = calcCourseHandicap(hi, slope, rating, par);
      
      // Expected: round(8.0 * (130 / 113) + (70.0 - 72))
      // = round(8.0 * 1.150 - 2.0)
      // = round(9.20 - 2.0)
      // = round(7.20)
      // = 7
      expect(ch).toBe(7);
    });
  });

  describe('calcPlayingHandicap', () => {
    it('should return 100% for match play', () => {
      const ch = 15;
      const ph = calcPlayingHandicap(ch, 'match_play_net');
      expect(ph).toBe(15);
    });

    it('should return 95% for stroke play', () => {
      const ch = 20;
      const ph = calcPlayingHandicap(ch, 'net_stroke');
      // 20 * 0.95 = 19
      expect(ph).toBe(19);
    });

    it('should round playing handicap correctly', () => {
      const ch = 17;
      const ph = calcPlayingHandicap(ch, 'net_stroke');
      // 17 * 0.95 = 16.15 -> rounds to 16
      expect(ph).toBe(16);
    });
  });

  describe('allocateStrokes', () => {
    const strokeIndex = [7, 3, 13, 1, 15, 9, 5, 17, 11, 4, 14, 2, 16, 8, 12, 6, 18, 10];

    it('should allocate strokes based on handicap difference', () => {
      const playerHandicaps = {
        'player1': 15,
        'player2': 10,
      };

      const allocation = allocateStrokes(playerHandicaps, strokeIndex);

      // Player 1 gets 5 strokes (15 - 10)
      // These should be on holes with stroke index 1-5
      const player1Strokes = allocation['player1'];
      expect(player1Strokes.reduce((a, b) => a + b, 0)).toBe(5);

      // Player 2 gets 0 strokes (lowest handicap)
      const player2Strokes = allocation['player2'];
      expect(player2Strokes.reduce((a, b) => a + b, 0)).toBe(0);
    });

    it('should handle strokes beyond 18', () => {
      const playerHandicaps = {
        'player1': 25,
        'player2': 5,
      };

      const allocation = allocateStrokes(playerHandicaps, strokeIndex);

      // Player 1 gets 20 strokes (25 - 5)
      // First 18 holes get 1 stroke each, then 2 more holes get a second stroke
      const player1Strokes = allocation['player1'];
      expect(player1Strokes.reduce((a, b) => a + b, 0)).toBe(20);

      // Some holes should have 2 strokes
      const holesWithTwoStrokes = player1Strokes.filter(s => s === 2).length;
      expect(holesWithTwoStrokes).toBe(2);
    });

    it('should throw error for invalid stroke index', () => {
      const playerHandicaps = { 'player1': 10, 'player2': 5 };
      const invalidStrokeIndex = [1, 2, 3]; // Only 3 values

      expect(() => {
        allocateStrokes(playerHandicaps, invalidStrokeIndex);
      }).toThrow('Stroke index must have exactly 18 values');
    });
  });
});