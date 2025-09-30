import { GHINProfile } from '../types';

const MOCK_DELAY = 1000;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * GHIN API Client
 * 
 * NOTE: This is a mock implementation for demonstration purposes.
 * In production, you would integrate with the actual GHIN API.
 * 
 * GHIN API access typically requires:
 * - Official partnership with USGA
 * - API credentials from GHIN
 * - OAuth authentication flow
 * - Proper data usage agreements
 */

export interface GHINCredentials {
  ghinNumber: string;
  lastName: string;
}

export interface GHINSyncResult {
  success: boolean;
  profile?: GHINProfile;
  error?: string;
}

/**
 * Verify GHIN credentials and fetch handicap data
 * 
 * In production, this would:
 * 1. Authenticate with GHIN API using OAuth or API key
 * 2. Fetch the golfer's profile using their GHIN number
 * 3. Return their current handicap index and history
 */
export async function verifyGHINCredentials(
  credentials: GHINCredentials
): Promise<GHINSyncResult> {
  await delay(MOCK_DELAY);

  // Mock validation - in production, this would call GHIN API
  if (!credentials.ghinNumber || credentials.ghinNumber.length < 7) {
    return {
      success: false,
      error: 'Invalid GHIN number. Please enter a valid 7-digit GHIN number.',
    };
  }

  if (!credentials.lastName || credentials.lastName.length < 2) {
    return {
      success: false,
      error: 'Last name is required for verification.',
    };
  }

  // Mock successful response
  const mockProfile: GHINProfile = {
    ghinNumber: credentials.ghinNumber,
    firstName: 'John',
    lastName: credentials.lastName,
    handicapIndex: 12.4,
    revisionDate: new Date().toISOString(),
    lowHandicapIndex: 10.2,
    club: 'Pebble Beach Golf Links',
    state: 'CA',
  };

  return {
    success: true,
    profile: mockProfile,
  };
}

/**
 * Sync handicap data from GHIN
 * 
 * In production, this would:
 * 1. Use stored OAuth token or API credentials
 * 2. Fetch latest handicap index from GHIN
 * 3. Fetch recent score history
 * 4. Return updated handicap data
 */
export async function syncGHINHandicap(
  ghinNumber: string
): Promise<GHINSyncResult> {
  await delay(MOCK_DELAY);

  // Mock sync - in production, this would call GHIN API
  const mockProfile: GHINProfile = {
    ghinNumber,
    firstName: 'John',
    lastName: 'Smith',
    handicapIndex: 12.4,
    revisionDate: new Date().toISOString(),
    lowHandicapIndex: 10.2,
    club: 'Pebble Beach Golf Links',
    state: 'CA',
  };

  return {
    success: true,
    profile: mockProfile,
  };
}

/**
 * Disconnect GHIN account
 * 
 * In production, this would:
 * 1. Revoke OAuth tokens
 * 2. Clear stored credentials
 * 3. Update user profile
 */
export async function disconnectGHIN(userId: string): Promise<boolean> {
  await delay(MOCK_DELAY);
  return true;
}

/**
 * Get GHIN connection instructions
 */
export function getGHINInstructions(): string {
  return `To connect your GHIN account:

1. You'll need your 7-digit GHIN number
2. Enter your last name as it appears in GHIN
3. We'll verify your identity and sync your official handicap

Your GHIN number can be found:
- On your GHIN card
- In the GHIN mobile app
- On your club's website
- By contacting your golf club

Note: This is a demonstration. In production, you would authenticate through GHIN's official OAuth flow.`;
}