/**
 * Mock API client for users
 * TODO(supabase): Replace with Supabase Auth and profiles
 */

import { Profile } from '../types';
import { mockDb } from '../store/mockDb';

const MOCK_DELAY = 300;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchCurrentUser(): Promise<Profile | null> {
  await delay(MOCK_DELAY);
  return mockDb.getCurrentUser() || null;
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  await delay(MOCK_DELAY);
  return mockDb.getProfile(id) || null;
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
  await delay(MOCK_DELAY);
  return mockDb.updateProfile(id, updates) || null;
}

export async function fetchProfiles(): Promise<Profile[]> {
  await delay(MOCK_DELAY);
  return mockDb.getProfiles();
}