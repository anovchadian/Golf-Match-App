import { Match, Profile, Course, Tee, Scorecard, HandicapHistoryEntry } from './types';
import { calculatePlayerHandicap, allocateStrokes } from './handicap';
import { computeMatchPlayResult } from './formats/matchPlay';
import { computeNetStrokeResult } from './formats/netStroke';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

export interface MatchStatistic {
date: string;
wins: number;
losses: number;
ties: number;
winnings: number;
cumulativeWinnings: number;
}

export interface FormatStatistic {
format: string;
matches: number;
wins: number;
losses: number;
ties: number;
winRate: number;
avgWinnings: number;
}

export interface CourseStatistic {
courseName: string;
matches: number;
wins: number;
losses: number;
winRate: number;
totalWinnings: number;
}

export interface MonthlyStatistic {
month: string;
matches: number;
wins: number;
winnings: number;
}

export interface PerformanceMetrics {
totalMatches: number;
totalWins: number;
totalLosses: number;
totalTies: number;
winRate: number;
totalWinnings: number;
avgWinningsPerMatch: number;
bestWin: number;
worstLoss: number;
currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
longestWinStreak: number;
longestLossStreak: number;
}

export interface HandicapProgressionData {
date: string;
handicapIndex: number;
source: string;
}

export interface HandicapTrend {
current: number;
starting: number;
change: number;
percentChange: number;
trend: 'improving' | 'regressing' | 'stable';
lowestHandicap: number;
highestHandicap: number;
}

export function calculateMatchOutcome(
match: Match,
tee: Tee,
players: Profile[],
scorecards: Scorecard[],
userId: string
): { result: 'won' | 'lost' | 'tied'; winnings: number } {
if (scorecards.length === 0) {
return { result: 'tied', winnings: 0 };
}

const playerHandicaps: { [userId: string]: number } = {};
players.forEach(player => {
const handicapInfo = calculatePlayerHandicap(
player.handicapIndex,
tee.slope,
tee.rating,
tee.par,
match.format
);
playerHandicaps[player.id] = handicapInfo.playingHandicap;
});

const strokeAllocation = allocateStrokes(playerHandicaps, tee.strokeIndex);

if (match.format === 'match_play_net' && scorecards.length === 2) {
const result = computeMatchPlayResult(scorecards, strokeAllocation);
if (!result.winner) {
return { result: 'tied', winnings: 0 };
}
if (result.winner === userId) {
return { result: 'won', winnings: match.stakesCents };
}
return { result: 'lost', winnings: -match.stakesCents };
} else if (match.format === 'net_stroke') {
const result = computeNetStrokeResult(scorecards, strokeAllocation);
if (!result.winner) {
return { result: 'tied', winnings: 0 };
}
if (result.winner === userId) {
const totalPot = match.stakesCents * players.length;
return { result: 'won', winnings: totalPot - match.stakesCents };
}
return { result: 'lost', winnings: -match.stakesCents };
}

return { result: 'tied', winnings: 0 };
}

export function calculateTimeSeriesStatistics(
matches: Array<{
match: Match;
outcome: 'won' | 'lost' | 'tied';
winnings: number;
}>,
days: number = 90
): MatchStatistic[] {
const startDate = subDays(new Date(), days);
const dateMap = new Map<string, MatchStatistic>();

for (let i = 0; i <= days; i++) {
const date = format(subDays(new Date(), days - i), 'MMM d');
dateMap.set(date, {
date,
wins: 0,
losses: 0,
ties: 0,
winnings: 0,
cumulativeWinnings: 0,
});
}

const filteredMatches = matches
.filter(m => isAfter(new Date(m.match.teeTimeISO), startDate))
.sort((a, b) => new Date(a.match.teeTimeISO).getTime() - new Date(b.match.teeTimeISO).getTime());

let cumulativeWinnings = 0;
filteredMatches.forEach(m => {
const date = format(new Date(m.match.teeTimeISO), 'MMM d');
const stat = dateMap.get(date);
if (stat) {
if (m.outcome === 'won') stat.wins++;
else if (m.outcome === 'lost') stat.losses++;
else stat.ties++;
stat.winnings += m.winnings;
cumulativeWinnings += m.winnings;
stat.cumulativeWinnings = cumulativeWinnings;
}
});

let runningTotal = 0;
const result: MatchStatistic[] = [];
dateMap.forEach(stat => {
runningTotal += stat.winnings;
stat.cumulativeWinnings = runningTotal;
result.push(stat);
});

return result;
}

export function calculateFormatStatistics(
matches: Array<{
match: Match;
outcome: 'won' | 'lost' | 'tied';
winnings: number;
}>
): FormatStatistic[] {
const formatMap = new Map<string, FormatStatistic>();

matches.forEach(m => {
const formatName = m.match.format === 'match_play_net' ? 'Match Play' : 'Stroke Play';

if (!formatMap.has(formatName)) {
formatMap.set(formatName, {
format: formatName,
matches: 0,
wins: 0,
losses: 0,
ties: 0,
winRate: 0,
avgWinnings: 0,
});
}

const stat = formatMap.get(formatName)!;
stat.matches++;
if (m.outcome === 'won') stat.wins++;
else if (m.outcome === 'lost') stat.losses++;
else stat.ties++;
});

const result: FormatStatistic[] = [];
formatMap.forEach(stat => {
stat.winRate = stat.matches > 0 ? (stat.wins / stat.matches) * 100 : 0;
const totalWinnings = matches
.filter(m => {
const formatName = m.match.format === 'match_play_net' ? 'Match Play' : 'Stroke Play';
return formatName === stat.format;
})
.reduce((sum, m) => sum + m.winnings, 0);
stat.avgWinnings = stat.matches > 0 ? totalWinnings / stat.matches : 0;
result.push(stat);
});

return result;
}

export function calculateCourseStatistics(
matches: Array<{
match: Match;
course: Course;
outcome: 'won' | 'lost' | 'tied';
winnings: number;
}>
): CourseStatistic[] {
const courseMap = new Map<string, CourseStatistic>();

matches.forEach(m => {
if (!courseMap.has(m.course.id)) {
courseMap.set(m.course.id, {
courseName: m.course.name,
matches: 0,
wins: 0,
losses: 0,
winRate: 0,
totalWinnings: 0,
});
}

const stat = courseMap.get(m.course.id)!;
stat.matches++;
if (m.outcome === 'won') stat.wins++;
else if (m.outcome === 'lost') stat.losses++;
stat.totalWinnings += m.winnings;
});

const result: CourseStatistic[] = [];
courseMap.forEach(stat => {
stat.winRate = stat.matches > 0 ? (stat.wins / stat.matches) * 100 : 0;
result.push(stat);
});

return result.sort((a, b) => b.matches - a.matches);
}

export function calculateMonthlyStatistics(
matches: Array<{
match: Match;
outcome: 'won' | 'lost' | 'tied';
winnings: number;
}>
): MonthlyStatistic[] {
const monthMap = new Map<string, MonthlyStatistic>();

matches.forEach(m => {
const month = format(new Date(m.match.teeTimeISO), 'MMM yyyy');

if (!monthMap.has(month)) {
monthMap.set(month, {
month,
matches: 0,
wins: 0,
winnings: 0,
});
}

const stat = monthMap.get(month)!;
stat.matches++;
if (m.outcome === 'won') stat.wins++;
stat.winnings += m.winnings;
});

return Array.from(monthMap.values()).sort((a, b) => {
return new Date(a.month).getTime() - new Date(b.month).getTime();
});
}

export function calculatePerformanceMetrics(
matches: Array<{
match: Match;
outcome: 'won' | 'lost' | 'tied';
winnings: number;
}>
): PerformanceMetrics {
const totalMatches = matches.length;
const totalWins = matches.filter(m => m.outcome === 'won').length;
const totalLosses = matches.filter(m => m.outcome === 'lost').length;
const totalTies = matches.filter(m => m.outcome === 'tied').length;
const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
const totalWinnings = matches.reduce((sum, m) => sum + m.winnings, 0);
const avgWinningsPerMatch = totalMatches > 0 ? totalWinnings / totalMatches : 0;
const bestWin = Math.max(...matches.map(m => m.winnings), 0);
const worstLoss = Math.min(...matches.map(m => m.winnings), 0);

let currentStreak = { type: 'none' as 'win' | 'loss' | 'none', count: 0 };
if (matches.length > 0) {
const sortedMatches = [...matches].sort(
(a, b) => new Date(b.match.teeTimeISO).getTime() - new Date(a.match.teeTimeISO).getTime()
);
const lastOutcome = sortedMatches[0].outcome;
if (lastOutcome !== 'tied') {
currentStreak.type = lastOutcome;
currentStreak.count = 1;
for (let i = 1; i < sortedMatches.length; i++) {
if (sortedMatches[i].outcome === lastOutcome) {
currentStreak.count++;
} else {
break;
}
}
}
}

let longestWinStreak = 0;
let longestLossStreak = 0;
let currentWinStreak = 0;
let currentLossStreak = 0;

const sortedMatches = [...matches].sort(
(a, b) => new Date(a.match.teeTimeISO).getTime() - new Date(b.match.teeTimeISO).getTime()
);

sortedMatches.forEach(m => {
if (m.outcome === 'won') {
currentWinStreak++;
currentLossStreak = 0;
longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
} else if (m.outcome === 'lost') {
currentLossStreak++;
currentWinStreak = 0;
longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
} else {
currentWinStreak = 0;
currentLossStreak = 0;
}
});

return {
totalMatches,
totalWins,
totalLosses,
totalTies,
winRate,
totalWinnings,
avgWinningsPerMatch,
bestWin,
worstLoss,
currentStreak,
longestWinStreak,
longestLossStreak,
};
}

export function calculateHandicapProgression(
handicapHistory: HandicapHistoryEntry[] | undefined
): HandicapProgressionData[] {
if (!handicapHistory || handicapHistory.length === 0) {
return [];
}

return handicapHistory.map(entry => ({
date: format(new Date(entry.date), 'MMM yyyy'),
handicapIndex: entry.handicapIndex,
source: entry.source,
}));
}

export function calculateHandicapTrend(
handicapHistory: HandicapHistoryEntry[] | undefined
): HandicapTrend | null {
if (!handicapHistory || handicapHistory.length < 2) {
return null;
}

const sorted = [...handicapHistory].sort(
(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);

const current = sorted[sorted.length - 1].handicapIndex;
const starting = sorted[0].handicapIndex;
const change = current - starting;
const percentChange = starting !== 0 ? (change / starting) * 100 : 0;

// In golf, lower handicap is better, so negative change is improvement
let trend: 'improving' | 'regressing' | 'stable';
if (Math.abs(change) < 0.5) {
trend = 'stable';
} else if (change < 0) {
trend = 'improving';
} else {
trend = 'regressing';
}

const lowestHandicap = Math.min(...sorted.map(h => h.handicapIndex));
const highestHandicap = Math.max(...sorted.map(h => h.handicapIndex));

return {
current,
starting,
change,
percentChange,
trend,
lowestHandicap,
highestHandicap,
};
}