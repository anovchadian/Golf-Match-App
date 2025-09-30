import { Profile, Course, Tee, Match, Scorecard, Wallet, WalletTransaction, HandicapHistoryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { subDays, subMonths } from 'date-fns';

const STORAGE_KEY = 'golf-match-db';

interface MockDatabase {
  profiles: Profile[];
  courses: Course[];
  tees: Tee[];
  matches: Match[];
  scorecards: Scorecard[];
  wallets: Wallet[];
  currentUserId: string;
}

function generateHandicapHistory(currentHandicap: number): HandicapHistoryEntry[] {
  const history: HandicapHistoryEntry[] = [];
  const startDate = subMonths(new Date(), 12);
  const startHandicap = currentHandicap + (Math.random() * 4 - 2);

  let handicap = startHandicap;

  for (let i = 0; i <= 12; i++) {
    const date = subMonths(new Date(), 12 - i);

    const change = (Math.random() - 0.5) * 0.8;
    handicap += change;

    handicap = Math.max(0, Math.min(36, handicap));

    history.push({
      date: date.toISOString(),
      handicapIndex: Math.round(handicap * 10) / 10,
      source: i % 3 === 0 ? 'ghin' : 'calculated',
    });
  }

  history[history.length - 1].handicapIndex = currentHandicap;

  return history;
}

const seedProfiles: Profile[] = [
  {
    id: 'user-1',
    displayName: 'John Smith',
    handicapIndex: 12.4,
    hiSource: 'ghin',
    verified: true,
    createdAt: new Date().toISOString(),
    handicapHistory: generateHandicapHistory(12.4),
  },
  {
    id: 'user-2',
    displayName: 'Mike Johnson',
    handicapIndex: 8.2,
    hiSource: 'ghin',
    verified: true,
    createdAt: new Date().toISOString(),
    handicapHistory: generateHandicapHistory(8.2),
  },
  {
    id: 'user-3',
    displayName: 'Sarah Williams',
    handicapIndex: 15.7,
    hiSource: 'self',
    verified: false,
    createdAt: new Date().toISOString(),
    handicapHistory: generateHandicapHistory(15.7),
  },
];

const seedCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Pebble Beach Golf Links',
    address: '1700 17 Mile Dr',
    city: 'Pebble Beach',
    state: 'CA',
    lat: 36.5674,
    lng: -121.9500,
    imageUrl: 'https://images.pexels.com/photos/914682/pexels-photo-914682.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  {
    id: 'course-2',
    name: 'Augusta National Golf Club',
    address: '2604 Washington Rd',
    city: 'Augusta',
    state: 'GA',
    lat: 33.5027,
    lng: -82.0199,
    imageUrl: 'https://images.pexels.com/photos/1325659/pexels-photo-1325659.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
  {
    id: 'course-3',
    name: 'Torrey Pines Golf Course',
    address: '11480 N Torrey Pines Rd',
    city: 'La Jolla',
    state: 'CA',
    lat: 32.9233,
    lng: -117.2521,
    imageUrl: 'https://images.pexels.com/photos/1409004/pexels-photo-1409004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  },
];

const seedTees: Tee[] = [
  {
    id: 'tee-1',
    courseId: 'course-1',
    name: 'Championship',
    color: 'Blue',
    slope: 145,
    rating: 75.5,
    par: 72,
    yardage: 6828,
    strokeIndex: [7, 3, 13, 1, 15, 9, 5, 17, 11, 4, 14, 2, 16, 8, 12, 6, 18, 10],
  },
  {
    id: 'tee-2',
    courseId: 'course-1',
    name: 'Regular',
    color: 'White',
    slope: 135,
    rating: 72.8,
    par: 72,
    yardage: 6357,
    strokeIndex: [7, 3, 13, 1, 15, 9, 5, 17, 11, 4, 14, 2, 16, 8, 12, 6, 18, 10],
  },
  {
    id: 'tee-3',
    courseId: 'course-2',
    name: 'Championship',
    color: 'Blue',
    slope: 148,
    rating: 76.2,
    par: 72,
    yardage: 7435,
    strokeIndex: [5, 1, 11, 7, 15, 3, 13, 17, 9, 2, 12, 6, 16, 4, 14, 8, 18, 10],
  },
];

const seedMatches: Match[] = [
  {
    id: 'match-1',
    courseId: 'course-1',
    teeId: 'tee-1',
    creatorId: 'user-1',
    teeTimeISO: new Date(Date.now() + 86400000).toISOString(),
    format: 'match_play_net',
    options: {},
    stakesCents: 5000,
    status: 'open',
    playerIds: ['user-1'],
    maxPlayers: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'match-2',
    courseId: 'course-2',
    teeId: 'tee-3',
    creatorId: 'user-2',
    teeTimeISO: new Date(Date.now() + 172800000).toISOString(),
    format: 'net_stroke',
    options: { skins: true },
    stakesCents: 10000,
    status: 'open',
    playerIds: ['user-2'],
    maxPlayers: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const seedWallets: Wallet[] = [
  {
    userId: 'user-1',
    balanceCents: 25000,
    transactions: [
      {
        id: uuidv4(),
        userId: 'user-1',
        type: 'deposit',
        amountCents: 50000,
        status: 'completed',
        createdAt: new Date(Date.now() - 604800000).toISOString(),
      },
      {
        id: uuidv4(),
        userId: 'user-1',
        type: 'escrow',
        amountCents: -5000,
        matchId: 'match-1',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
];

class MockDB {
  private data: MockDatabase;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): MockDatabase {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        parsed.profiles = parsed.profiles.map((profile: Profile) => ({
          ...profile,
          handicapHistory: profile.handicapHistory || generateHandicapHistory(profile.handicapIndex),
        }));
        return parsed;
      } catch (e) {
        console.error('Failed to parse stored data', e);
      }
    }

    return {
      profiles: seedProfiles,
      courses: seedCourses,
      tees: seedTees,
      matches: seedMatches,
      scorecards: [],
      wallets: seedWallets,
      currentUserId: 'user-1',
    };
  }

  private saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getProfiles(): Profile[] {
    return [...this.data.profiles];
  }

  getProfile(id: string): Profile | undefined {
    return this.data.profiles.find(p => p.id === id);
  }

  getCurrentUser(): Profile | undefined {
    return this.getProfile(this.data.currentUserId);
  }

  updateProfile(id: string, updates: Partial<Profile>): Profile | undefined {
    const index = this.data.profiles.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    this.data.profiles[index] = { ...this.data.profiles[index], ...updates };
    this.saveToStorage();
    return this.data.profiles[index];
  }

  addHandicapEntry(userId: string, entry: HandicapHistoryEntry): Profile | undefined {
    const profile = this.getProfile(userId);
    if (!profile) return undefined;

    const history = profile.handicapHistory || [];
    history.push(entry);
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return this.updateProfile(userId, {
      handicapIndex: entry.handicapIndex,
      handicapHistory: history,
    });
  }

  getCourses(): Course[] {
    return [...this.data.courses];
  }

  getCourse(id: string): Course | undefined {
    return this.data.courses.find(c => c.id === id);
  }

  createCourse(course: Omit<Course, 'id'>): Course {
    const newCourse: Course = {
      ...course,
      id: uuidv4(),
    };
    this.data.courses.push(newCourse);
    this.saveToStorage();
    return newCourse;
  }

  updateCourse(id: string, updates: Partial<Course>): Course | undefined {
    const index = this.data.courses.findIndex(c => c.id === id);
    if (index === -1) return undefined;

    this.data.courses[index] = { ...this.data.courses[index], ...updates };
    this.saveToStorage();
    return this.data.courses[index];
  }

  deleteCourse(id: string): boolean {
    const index = this.data.courses.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.data.courses.splice(index, 1);
    this.data.tees = this.data.tees.filter(t => t.courseId !== id);
    this.saveToStorage();
    return true;
  }

  getTees(courseId?: string): Tee[] {
    if (courseId) {
      return this.data.tees.filter(t => t.courseId === courseId);
    }
    return [...this.data.tees];
  }

  getTee(id: string): Tee | undefined {
    return this.data.tees.find(t => t.id === id);
  }

  createTee(tee: Omit<Tee, 'id'>): Tee {
    const newTee: Tee = {
      ...tee,
      id: uuidv4(),
    };
    this.data.tees.push(newTee);
    this.saveToStorage();
    return newTee;
  }

  updateTee(id: string, updates: Partial<Tee>): Tee | undefined {
    const index = this.data.tees.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    this.data.tees[index] = { ...this.data.tees[index], ...updates };
    this.saveToStorage();
    return this.data.tees[index];
  }

  deleteTee(id: string): boolean {
    const index = this.data.tees.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.data.tees.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getMatches(filters?: { status?: string; courseId?: string }): Match[] {
    let matches = [...this.data.matches];

    if (filters?.status) {
      matches = matches.filter(m => m.status === filters.status);
    }

    if (filters?.courseId) {
      matches = matches.filter(m => m.courseId === filters.courseId);
    }

    return matches;
  }

  getMatch(id: string): Match | undefined {
    return this.data.matches.find(m => m.id === id);
  }

  createMatch(match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Match {
    const newMatch: Match = {
      ...match,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.matches.push(newMatch);
    this.saveToStorage();
    return newMatch;
  }

  updateMatch(id: string, updates: Partial<Match>): Match | undefined {
    const index = this.data.matches.findIndex(m => m.id === id);
    if (index === -1) return undefined;

    this.data.matches[index] = {
      ...this.data.matches[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.data.matches[index];
  }

  getScorecards(matchId: string): Scorecard[] {
    return this.data.scorecards.filter(s => s.matchId === matchId);
  }

  getScorecard(matchId: string, userId: string): Scorecard | undefined {
    return this.data.scorecards.find(
      s => s.matchId === matchId && s.userId === userId
    );
  }

  createScorecard(scorecard: Omit<Scorecard, 'id' | 'createdAt' | 'updatedAt'>): Scorecard {
    const newScorecard: Scorecard = {
      ...scorecard,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.scorecards.push(newScorecard);
    this.saveToStorage();
    return newScorecard;
  }

  updateScorecard(id: string, updates: Partial<Scorecard>): Scorecard | undefined {
    const index = this.data.scorecards.findIndex(s => s.id === id);
    if (index === -1) return undefined;

    this.data.scorecards[index] = {
      ...this.data.scorecards[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.data.scorecards[index];
  }

  getWallet(userId: string): Wallet | undefined {
    return this.data.wallets.find(w => w.userId === userId);
  }

  updateWallet(userId: string, updates: Partial<Wallet>): Wallet | undefined {
    const index = this.data.wallets.findIndex(w => w.userId === userId);
    if (index === -1) {

      const newWallet: Wallet = {
        userId,
        balanceCents: 0,
        transactions: [],
        ...updates,
      };
      this.data.wallets.push(newWallet);
      this.saveToStorage();
      return newWallet;
    }

    this.data.wallets[index] = { ...this.data.wallets[index], ...updates };
    this.saveToStorage();
    return this.data.wallets[index];
  }

  addTransaction(userId: string, transaction: Omit<WalletTransaction, 'id' | 'createdAt'>): WalletTransaction {
    const wallet = this.getWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const newTransaction: WalletTransaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    wallet.transactions.push(newTransaction);

    if (transaction.status === 'completed') {
      wallet.balanceCents += transaction.amountCents;
    }

    this.updateWallet(userId, wallet);
    return newTransaction;
  }

  reset() {
    this.data = {
      profiles: seedProfiles,
      courses: seedCourses,
      tees: seedTees,
      matches: seedMatches,
      scorecards: [],
      wallets: seedWallets,
      currentUserId: 'user-1',
    };
    this.saveToStorage();
  }
}

export const mockDb = new MockDB();