import { Scorecard, ScorecardEntry } from '../types';
import { mockDb } from '../store/mockDb';

const MOCK_DELAY = 300;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchScorecards(matchId: string): Promise<Scorecard[]> {
  await delay(MOCK_DELAY);
  return mockDb.getScorecards(matchId);
}

export async function fetchScorecard(matchId: string, userId: string): Promise<Scorecard | null> {
  await delay(MOCK_DELAY);
  return mockDb.getScorecard(matchId, userId) || null;
}

export async function createScorecard(
  matchId: string,
  userId: string
): Promise<Scorecard> {
  await delay(MOCK_DELAY);
  return mockDb.createScorecard({
    matchId,
    userId,
    entries: [],
  });
}

export async function updateScorecardEntry(
  scorecardId: string,
  hole: number,
  strokes: number
): Promise<Scorecard | null> {
  await delay(MOCK_DELAY);
  
  const scorecard = mockDb.getScorecard('', ''); // We'll find it by ID
  if (!scorecard) return null;

  const entries = [...scorecard.entries];
  const existingIndex = entries.findIndex(e => e.hole === hole);

  if (existingIndex >= 0) {
    entries[existingIndex] = { hole, strokes };
  } else {
    entries.push({ hole, strokes });
  }

  entries.sort((a, b) => a.hole - b.hole);

  return mockDb.updateScorecard(scorecardId, { entries }) || null;
}

export async function submitScorecard(
  scorecardId: string,
  attestedBy?: string
): Promise<Scorecard | null> {
  await delay(MOCK_DELAY);
  return mockDb.updateScorecard(scorecardId, {
    attestedBy,
    submittedAt: new Date().toISOString(),
  }) || null;
}