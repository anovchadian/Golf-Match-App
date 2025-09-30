export interface Profile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  handicapIndex: number;
  hiSource: 'self' | 'ghin' | 'other';
  verified: boolean;
  createdAt: string;
  handicapHistory?: HandicapHistoryEntry[];
  ghinConnected?: boolean;
  ghinId?: string;
  ghinLastSync?: string;
}

export interface HandicapHistoryEntry {
  date: string;
  handicapIndex: number;
  source: 'calculated' | 'manual' | 'ghin';
}

export interface Course {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

export interface Tee {
  id: string;
  courseId: string;
  name: string;
  color: string;
  slope: number;
  rating: number;
  par: number;
  strokeIndex: number[]; 
  yardage: number;
}

export type MatchFormat = 'match_play_net' | 'net_stroke';

export interface MatchOptions {
  skins?: boolean;
  nassau?: boolean;
}

export type MatchStatus = 'open' | 'in_progress' | 'completed' | 'settled' | 'canceled';

export interface Match {
  id: string;
  courseId: string;
  teeId: string;
  creatorId: string;
  teeTimeISO: string;
  format: MatchFormat;
  options: MatchOptions;
  stakesCents: number;
  status: MatchStatus;
  playerIds: string[];
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardEntry {
  hole: number; 
  strokes: number;
}

export interface Scorecard {
  id: string;
  matchId: string;
  userId: string;
  entries: ScorecardEntry[];
  attestedBy?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrokeAllocation {
  [userId: string]: number[]; 
}

export interface HoleResult {
  hole: number;
  result: 'W' | 'L' | 'P'; 
  netScore: number;
}

export interface MatchPlayResult {
  holes: HoleResult[];
  winner?: string;
  upDownHistory: number[]; 
}

export interface NetStrokeResult {
  netTotals: { [userId: string]: number };
  winner?: string;
}

export interface SkinsResult {
  holes: { hole: number; winner?: string; carryover: number }[];
  winners: { [userId: string]: number }; 
}

export interface NassauResult {
  front: { winner?: string; amount: number };
  back: { winner?: string; amount: number };
  overall: { winner?: string; amount: number };
}

export interface SettlementPreview {
  matchId: string;
  winners: string[];
  breakdown: {
    userId: string;
    amount: number; 
    reason: string;
  }[];
  totalPot: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'escrow' | 'payout' | 'refund';
  amountCents: number;
  matchId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Wallet {
  userId: string;
  balanceCents: number;
  transactions: WalletTransaction[];
}

export interface GeofenceCheck {
  userId: string;
  courseId: string;
  timestamp: string;
  distance: number; 
  verified: boolean;
}

export interface HandicapCalculation {
  handicapIndex: number;
  courseHandicap: number;
  playingHandicap: number;
}

export interface PlayerHandicaps {
  [userId: string]: HandicapCalculation;
}

export interface GHINProfile {
  ghinNumber: string;
  firstName: string;
  lastName: string;
  handicapIndex: number;
  revisionDate: string;
  lowHandicapIndex: number;
  club: string;
  state: string;
}