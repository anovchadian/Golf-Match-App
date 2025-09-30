/**
 * Mock API client for matches
 * TODO(supabase): Replace with Supabase client calls
 */

import { Match } from '../types';
import { mockDb } from '../store/mockDb';

const MOCK_DELAY = 400;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchMatches(filters?: { status?: string; courseId?: string }): Promise<Match[]> {
  await delay(MOCK_DELAY);
  return mockDb.getMatches(filters);
}

export async function fetchMatch(id: string): Promise<Match | null> {
  await delay(MOCK_DELAY);
  return mockDb.getMatch(id) || null;
}

export async function createMatch(match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
  await delay(MOCK_DELAY);
  return mockDb.createMatch(match);
}

export async function joinMatch(matchId: string, userId: string): Promise<Match | null> {
  await delay(MOCK_DELAY);
  const match = mockDb.getMatch(matchId);
  if (!match) return null;

  if (match.playerIds.includes(userId)) {
    return match; // Already joined
  }

  if (match.playerIds.length >= match.maxPlayers) {
    throw new Error('Match is full');
  }

  return mockDb.updateMatch(matchId, {
    playerIds: [...match.playerIds, userId],
    status: match.playerIds.length + 1 >= match.maxPlayers ? 'in_progress' : match.status,
  }) || null;
}

export async function updateMatchStatus(matchId: string, status: Match['status']): Promise<Match | null> {
  await delay(MOCK_DELAY);
  return mockDb.updateMatch(matchId, { status }) || null;
}