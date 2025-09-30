/**
 * Mock API client for wallet
 * TODO(stripe): Replace with Stripe Connect integration
 */

import { Wallet, WalletTransaction } from '../types';
import { mockDb } from '../store/mockDb';

const MOCK_DELAY = 400;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWallet(userId: string): Promise<Wallet | null> {
  await delay(MOCK_DELAY);
  return mockDb.getWallet(userId) || null;
}

export async function createEscrow(userId: string, matchId: string, amountCents: number): Promise<WalletTransaction> {
  await delay(MOCK_DELAY);
  
  // TODO(stripe): Create Stripe payment intent and hold funds
  return mockDb.addTransaction(userId, {
    userId,
    type: 'escrow',
    amountCents: -amountCents,
    matchId,
    status: 'completed',
  });
}

export async function processPayout(userId: string, matchId: string, amountCents: number): Promise<WalletTransaction> {
  await delay(MOCK_DELAY);
  
  // TODO(stripe): Process Stripe transfer to connected account
  return mockDb.addTransaction(userId, {
    userId,
    type: 'payout',
    amountCents,
    matchId,
    status: 'completed',
  });
}