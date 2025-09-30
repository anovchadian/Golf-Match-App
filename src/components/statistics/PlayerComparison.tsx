import { useState, useEffect, useMemo } from 'react';
import { Users, TrendingUp, TrendingDown, Trophy, DollarSign, Target, Award, Search, X, Swords } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Profile } from '@/lib/types';
import { centsToDisplay } from '@/lib/money';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface PlayerStats {
player: Profile;
totalMatches: number;
totalWins: number;
totalLosses: number;
totalTies: number;
winRate: number;
totalWinnings: number;
avgWinningsPerMatch: number;
bestWin: number;
currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
longestWinStreak: number;
}

interface HeadToHeadRecord {
opponent: Profile;
wins: number;
losses: number;
ties: number;
totalMatches: number;
winRate: number;
netWinnings: number;
}

interface PlayerComparisonProps {
currentUser: Profile;
currentUserStats: PlayerStats;
availablePlayers: Profile[];
allMatchData: any[];
}

const COLORS = {
primary: '#16a34a',
secondary: '#3b82f6',
tertiary: '#f59e0b',
quaternary: '#8b5cf6',
};

export function PlayerComparison({ 
currentUser, 
currentUserStats, 
availablePlayers,
allMatchData 
}: PlayerComparisonProps) {
const [selectedPlayers, setSelectedPlayers] = useState<Profile[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [comparisonStats, setComparisonStats] = useState<PlayerStats[]>([]);
const [headToHeadRecords, setHeadToHeadRecords] = useState<HeadToHeadRecord[]>([]);

const filteredPlayers = useMemo(() => {
return availablePlayers.filter(player => 
player.id !== currentUser.id &&
!selectedPlayers.find(p => p.id === player.id) &&
player.displayName.toLowerCase().includes(searchQuery.toLowerCase())
);
}, [availablePlayers, currentUser.id, selectedPlayers, searchQuery]);

useEffect(() => {
calculateComparisonStats();
calculateHeadToHeadRecords();
}, [selectedPlayers, allMatchData]);

function calculateHeadToHeadRecords() {
const records: HeadToHeadRecord[] = selectedPlayers.map(opponent => {
// Find matches where both current user and opponent played
const directMatches = allMatchData.filter(m => 
m.players.some((p: Profile) => p.id === currentUser.id) &&
m.players.some((p: Profile) => p.id === opponent.id)
);

let wins = 0;
let losses = 0;
let ties = 0;
let netWinnings = 0;

directMatches.forEach(match => {
// Determine the outcome from current user's perspective
const currentUserOutcome = match.outcome;

if (currentUserOutcome === 'won') {
wins++;
} else if (currentUserOutcome === 'lost') {
losses++;
} else {
ties++;
}

netWinnings += match.winnings;
});

const totalMatches = directMatches.length;
const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

return {
opponent,
wins,
losses,
ties,
totalMatches,
winRate,
netWinnings,
};
});

setHeadToHeadRecords(records);
}

function calculateComparisonStats() {
const stats: PlayerStats[] = selectedPlayers.map(player => {
const playerMatches = allMatchData.filter(m => 
m.players.some((p: Profile) => p.id === player.id)
);

const wins = playerMatches.filter(m => m.outcome === 'won').length;
const losses = playerMatches.filter(m => m.outcome === 'lost').length;
const ties = playerMatches.filter(m => m.outcome === 'tied').length;
const totalMatches = playerMatches.length;
const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
const totalWinnings = playerMatches.reduce((sum, m) => sum + m.winnings, 0);
const avgWinningsPerMatch = totalMatches > 0 ? totalWinnings / totalMatches : 0;
const bestWin = Math.max(...playerMatches.map(m => m.winnings), 0);

let currentStreak = { type: 'none' as 'win' | 'loss' | 'none', count: 0 };
if (playerMatches.length > 0) {
const sortedMatches = [...playerMatches].sort(
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
let currentWinStreak = 0;
const sortedMatches = [...playerMatches].sort(
(a, b) => new Date(a.match.teeTimeISO).getTime() - new Date(b.match.teeTimeISO).getTime()
);
sortedMatches.forEach(m => {
if (m.outcome === 'won') {
currentWinStreak++;
longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
} else {
currentWinStreak = 0;
}
});

return {
player,
totalMatches,
totalWins: wins,
totalLosses: losses,
totalTies: ties,
winRate,
totalWinnings,
avgWinningsPerMatch,
bestWin,
currentStreak,
longestWinStreak,
};
});

setComparisonStats(stats);
}

function addPlayer(player: Profile) {
if (selectedPlayers.length < 3) {
setSelectedPlayers([...selectedPlayers, player]);
setSearchQuery('');
}
}

function removePlayer(playerId: string) {
setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
}

const radarData = useMemo(() => {
if (comparisonStats.length === 0) return [];

const maxWinRate = Math.max(currentUserStats.winRate, ...comparisonStats.map(s => s.winRate), 1);
const maxWinnings = Math.max(
Math.abs(currentUserStats.totalWinnings), 
...comparisonStats.map(s => Math.abs(s.totalWinnings)),
1
);
const maxMatches = Math.max(currentUserStats.totalMatches, ...comparisonStats.map(s => s.totalMatches), 1);
const maxStreak = Math.max(currentUserStats.longestWinStreak, ...comparisonStats.map(s => s.longestWinStreak), 1);

return [
{
metric: 'Win Rate',
[currentUser.displayName]: (currentUserStats.winRate / maxWinRate) * 100,
...Object.fromEntries(
comparisonStats.map(s => [s.player.displayName, (s.winRate / maxWinRate) * 100])
),
},
{
metric: 'Total Winnings',
[currentUser.displayName]: (Math.abs(currentUserStats.totalWinnings) / maxWinnings) * 100,
...Object.fromEntries(
comparisonStats.map(s => [s.player.displayName, (Math.abs(s.totalWinnings) / maxWinnings) * 100])
),
},
{
metric: 'Matches Played',
[currentUser.displayName]: (currentUserStats.totalMatches / maxMatches) * 100,
...Object.fromEntries(
comparisonStats.map(s => [s.player.displayName, (s.totalMatches / maxMatches) * 100])
),
},
{
metric: 'Best Streak',
[currentUser.displayName]: (currentUserStats.longestWinStreak / maxStreak) * 100,
...Object.fromEntries(
comparisonStats.map(s => [s.player.displayName, (s.longestWinStreak / maxStreak) * 100])
),
},
{
metric: 'Avg Win/Match',
[currentUser.displayName]: currentUserStats.avgWinningsPerMatch > 0 
? (currentUserStats.avgWinningsPerMatch / Math.max(
currentUserStats.avgWinningsPerMatch,
...comparisonStats.map(s => s.avgWinningsPerMatch),
1
)) * 100
: 0,
...Object.fromEntries(
comparisonStats.map(s => [
s.player.displayName, 
s.avgWinningsPerMatch > 0
? (s.avgWinningsPerMatch / Math.max(
currentUserStats.avgWinningsPerMatch,
...comparisonStats.map(st => st.avgWinningsPerMatch),
1
)) * 100
: 0
])
),
},
];
}, [currentUser, currentUserStats, comparisonStats]);

const winRateData = useMemo(() => {
return [
{
name: currentUser.displayName,
winRate: currentUserStats.winRate,
color: COLORS.primary,
},
...comparisonStats.map((stat, index) => ({
name: stat.player.displayName,
winRate: stat.winRate,
color: [COLORS.secondary, COLORS.tertiary, COLORS.quaternary][index],
})),
];
}, [currentUser, currentUserStats, comparisonStats]);

const winningsData = useMemo(() => {
return [
{
name: currentUser.displayName,
winnings: currentUserStats.totalWinnings,
color: COLORS.primary,
},
...comparisonStats.map((stat, index) => ({
name: stat.player.displayName,
winnings: stat.totalWinnings,
color: [COLORS.secondary, COLORS.tertiary, COLORS.quaternary][index],
})),
];
}, [currentUser, currentUserStats, comparisonStats]);

return (
<div className="space-y-6">
{/* Player Selection */}
<Card>
<CardHeader>
<CardTitle className="flex items-center gap-2">
<Users className="h-5 w-5" />
Compare Players
</CardTitle>
<CardDescription>
Select up to 3 players to compare your statistics against
</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
{/* Selected Players */}
<div className="flex flex-wrap gap-2">
<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900 border-2 border-green-600">
<Avatar className="h-6 w-6">
<AvatarImage src={currentUser.avatarUrl} />
<AvatarFallback className="text-xs">
{currentUser.displayName.substring(0, 2).toUpperCase()}
</AvatarFallback>
</Avatar>
<span className="text-sm font-semibold text-green-900 dark:text-green-100">
{currentUser.displayName} (You)
</span>
</div>

{selectedPlayers.map((player, index) => (
<div
key={player.id}
className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border-2 border-border"
>
<Avatar className="h-6 w-6">
<AvatarImage src={player.avatarUrl} />
<AvatarFallback className="text-xs">
{player.displayName.substring(0, 2).toUpperCase()}
</AvatarFallback>
</Avatar>
<span className="text-sm font-semibold">{player.displayName}</span>
<button
onClick={() => removePlayer(player.id)}
className="ml-1 hover:bg-destructive/20 rounded-full p-1"
>
<X className="h-3 w-3" />
</button>
</div>
))}

{selectedPlayers.length < 3 && (
<Badge variant="outline" className="px-3 py-2">
{3 - selectedPlayers.length} more player{3 - selectedPlayers.length !== 1 ? 's' : ''}
</Badge>
)}
</div>

{/* Player Search */}
{selectedPlayers.length < 3 && (
<div className="space-y-2">
<div className="relative">
<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
<Input
placeholder="Search players you've played with..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="pl-10"
/>
</div>

{searchQuery && (
<div className="max-h-48 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
{filteredPlayers.length === 0 ? (
<p className="text-sm text-muted-foreground text-center py-4">
No players found
</p>
) : (
filteredPlayers.slice(0, 5).map(player => (
<button
key={player.id}
onClick={() => addPlayer(player)}
className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
>
<Avatar className="h-8 w-8">
<AvatarImage src={player.avatarUrl} />
<AvatarFallback className="text-xs">
{player.displayName.substring(0, 2).toUpperCase()}
</AvatarFallback>
</Avatar>
<div className="flex-1 text-left">
<p className="text-sm font-semibold">{player.displayName}</p>
<p className="text-xs text-muted-foreground">
HI: {player.handicapIndex}
</p>
</div>
</button>
))
)}
</div>
)}
</div>
)}
</CardContent>
</Card>

{/* Head-to-Head Records */}
{headToHeadRecords.length > 0 && (
<Card>
<CardHeader>
<CardTitle className="flex items-center gap-2">
<Swords className="h-5 w-5" />
Head-to-Head Records
</CardTitle>
<CardDescription>
Your direct matchup record against each selected player
</CardDescription>
</CardHeader>
<CardContent>
<div className="space-y-4">
{headToHeadRecords.map((record, index) => {
const hasAdvantage = record.wins > record.losses;
const isEven = record.wins === record.losses;
const totalMatches = record.totalMatches;

return (
<div
key={record.opponent.id}
className={cn(
'rounded-lg border-2 p-4',
totalMatches === 0 
? 'border-border bg-muted/50'
: hasAdvantage 
? 'border-green-600 bg-green-50 dark:bg-green-950'
: isEven
? 'border-orange-600 bg-orange-50 dark:bg-orange-950'
: 'border-red-600 bg-red-50 dark:bg-red-950'
)}
>
<div className="flex items-center justify-between mb-3">
<div className="flex items-center gap-3">
<Avatar className="h-12 w-12">
<AvatarImage src={record.opponent.avatarUrl} />
<AvatarFallback>
{record.opponent.displayName.substring(0, 2).toUpperCase()}
</AvatarFallback>
</Avatar>
<div>
<p className="font-semibold text-lg">{record.opponent.displayName}</p>
<p className="text-sm text-muted-foreground">
HI: {record.opponent.handicapIndex}
</p>
</div>
</div>

{totalMatches > 0 ? (
<div className="text-right">
<div className="flex items-center gap-2">
<Badge
variant={hasAdvantage ? 'default' : isEven ? 'secondary' : 'destructive'}
className={cn(
'text-lg font-bold px-3 py-1',
hasAdvantage && 'bg-green-600',
isEven && 'bg-orange-600'
)}
>
{record.wins}-{record.losses}-{record.ties}
</Badge>
</div>
<p className="text-xs text-muted-foreground mt-1">
{record.winRate.toFixed(0)}% win rate
</p>
</div>
) : (
<Badge variant="outline" className="text-sm">
No Direct Matches
</Badge>
)}
</div>

{totalMatches > 0 && (
<>
<div className="grid grid-cols-3 gap-3 mb-3">
<div className="text-center p-2 rounded-lg bg-green-100 dark:bg-green-900">
<p className="text-2xl font-bold text-green-700 dark:text-green-300">
{record.wins}
</p>
<p className="text-xs text-green-600 dark:text-green-400">Wins</p>
</div>
<div className="text-center p-2 rounded-lg bg-red-100 dark:bg-red-900">
<p className="text-2xl font-bold text-red-700 dark:text-red-300">
{record.losses}
</p>
<p className="text-xs text-red-600 dark:text-red-400">Losses</p>
</div>
<div className="text-center p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
<p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
{record.ties}
</p>
<p className="text-xs text-gray-600 dark:text-gray-400">Ties</p>
</div>
</div>

<div className="space-y-2">
<div className="flex justify-between text-sm">
<span className="text-muted-foreground">Total Matches:</span>
<span className="font-semibold">{totalMatches}</span>
</div>
<div className="flex justify-between text-sm">
<span className="text-muted-foreground">Net Winnings:</span>
<span className={cn(
'font-semibold',
record.netWinnings > 0 ? 'text-green-600' : 
record.netWinnings < 0 ? 'text-red-600' : ''
)}>
{record.netWinnings > 0 ? '+' : ''}{centsToDisplay(record.netWinnings)}
</span>
</div>
</div>

{/* Win Rate Progress Bar */}
<div className="mt-3">
<div className="flex justify-between text-xs text-muted-foreground mb-1">
<span>Your Win Rate</span>
<span>{record.winRate.toFixed(1)}%</span>
</div>
<div className="h-2 bg-muted rounded-full overflow-hidden">
<div
className={cn(
'h-full rounded-full transition-all',
hasAdvantage ? 'bg-green-600' : isEven ? 'bg-orange-600' : 'bg-red-600'
)}
style={{ width: `${record.winRate}%` }}
/>
</div>
</div>
</>
)}

{totalMatches === 0 && (
<div className="text-center py-4">
<p className="text-sm text-muted-foreground">
You haven't played any matches together yet
</p>
</div>
)}
</div>
);
})}
</div>
</CardContent>
</Card>
)}

{/* Overall Performance Comparison */}
{comparisonStats.length > 0 && (
<>
{/* Radar Chart */}
<Card>
<CardHeader>
<CardTitle>Overall Performance Comparison</CardTitle>
<CardDescription>
Normalized comparison across key performance metrics
</CardDescription>
</CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={400}>
<RadarChart data={radarData}>
<PolarGrid stroke="#e5e7eb" />
<PolarAngleAxis 
dataKey="metric" 
tick={{ fontSize: 12, fill: '#6b7280' }}
/>
<PolarRadiusAxis 
angle={90} 
domain={[0, 100]}
tick={{ fontSize: 10, fill: '#6b7280' }}
/>
<Radar
name={currentUser.displayName}
dataKey={currentUser.displayName}
stroke={COLORS.primary}
fill={COLORS.primary}
fillOpacity={0.3}
strokeWidth={2}
/>
{comparisonStats.map((stat, index) => (
<Radar
key={stat.player.id}
name={stat.player.displayName}
dataKey={stat.player.displayName}
stroke={[COLORS.secondary, COLORS.tertiary, COLORS.quaternary][index]}
fill={[COLORS.secondary, COLORS.tertiary, COLORS.quaternary][index]}
fillOpacity={0.3}
strokeWidth={2}
/>
))}
<Legend />
<Tooltip
contentStyle={{
backgroundColor: 'white',
border: '1px solid #e5e7eb',
borderRadius: '8px',
padding: '12px',
}}
formatter={(value: number) => `${value.toFixed(1)}%`}
/>
</RadarChart>
</ResponsiveContainer>
</CardContent>
</Card>

{/* Bar Charts */}
<div className="grid gap-4 md:grid-cols-2">
{/* Win Rate Comparison */}
<Card>
<CardHeader>
<CardTitle className="text-lg">Win Rate Comparison</CardTitle>
</CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={250}>
<BarChart data={winRateData}>
<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
<XAxis 
dataKey="name" 
stroke="#6b7280"
tick={{ fontSize: 11 }}
angle={-45}
textAnchor="end"
height={80}
/>
<YAxis 
stroke="#6b7280"
tick={{ fontSize: 11 }}
tickFormatter={(value) => `${value}%`}
/>
<Tooltip
contentStyle={{
backgroundColor: 'white',
border: '1px solid #e5e7eb',
borderRadius: '8px',
padding: '12px',
}}
formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
/>
<Bar dataKey="winRate" radius={[8, 8, 0, 0]}>
{winRateData.map((entry, index) => (
<Cell key={`cell-${index}`} fill={entry.color} />
))}
</Bar>
</BarChart>
</ResponsiveContainer>
</CardContent>
</Card>

{/* Total Winnings Comparison */}
<Card>
<CardHeader>
<CardTitle className="text-lg">Total Winnings Comparison</CardTitle>
</CardHeader>
<CardContent>
<ResponsiveContainer width="100%" height={250}>
<BarChart data={winningsData}>
<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
<XAxis 
dataKey="name" 
stroke="#6b7280"
tick={{ fontSize: 11 }}
angle={-45}
textAnchor="end"
height={80}
/>
<YAxis 
stroke="#6b7280"
tick={{ fontSize: 11 }}
tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
/>
<Tooltip
contentStyle={{
backgroundColor: 'white',
border: '1px solid #e5e7eb',
borderRadius: '8px',
padding: '12px',
}}
formatter={(value: number) => [centsToDisplay(value), 'Total Winnings']}
/>
<Bar dataKey="winnings" radius={[8, 8, 0, 0]}>
{winningsData.map((entry, index) => (
<Cell key={`cell-${index}`} fill={entry.color} />
))}
</Bar>
</BarChart>
</ResponsiveContainer>
</CardContent>
</Card>
</div>

{/* Detailed Statistics Table */}
<Card>
<CardHeader>
<CardTitle>Detailed Statistics</CardTitle>
<CardDescription>
Head-to-head comparison of key performance indicators
</CardDescription>
</CardHeader>
<CardContent>
<div className="overflow-x-auto">
<table className="w-full">
<thead>
<tr className="border-b border-border">
<th className="text-left py-3 px-4 font-semibold">Metric</th>
<th className="text-center py-3 px-4 font-semibold bg-green-50 dark:bg-green-950">
{currentUser.displayName}
</th>
{comparisonStats.map(stat => (
<th key={stat.player.id} className="text-center py-3 px-4 font-semibold">
{stat.player.displayName}
</th>
))}
</tr>
</thead>
<tbody>
<ComparisonRow
label="Total Matches"
icon={<Trophy className="h-4 w-4" />}
currentValue={currentUserStats.totalMatches}
comparisonValues={comparisonStats.map(s => s.totalMatches)}
formatter={(v) => v.toString()}
higherIsBetter={true}
/>
<ComparisonRow
label="Win Rate"
icon={<Target className="h-4 w-4" />}
currentValue={currentUserStats.winRate}
comparisonValues={comparisonStats.map(s => s.winRate)}
formatter={(v) => `${v.toFixed(1)}%`}
higherIsBetter={true}
/>
<ComparisonRow
label="Total Winnings"
icon={<DollarSign className="h-4 w-4" />}
currentValue={currentUserStats.totalWinnings}
comparisonValues={comparisonStats.map(s => s.totalWinnings)}
formatter={(v) => centsToDisplay(v)}
higherIsBetter={true}
/>
<ComparisonRow
label="Avg Win/Match"
icon={<DollarSign className="h-4 w-4" />}
currentValue={currentUserStats.avgWinningsPerMatch}
comparisonValues={comparisonStats.map(s => s.avgWinningsPerMatch)}
formatter={(v) => centsToDisplay(v)}
higherIsBetter={true}
/>
<ComparisonRow
label="Best Win"
icon={<Award className="h-4 w-4" />}
currentValue={currentUserStats.bestWin}
comparisonValues={comparisonStats.map(s => s.bestWin)}
formatter={(v) => centsToDisplay(v)}
higherIsBetter={true}
/>
<ComparisonRow
label="Longest Win Streak"
icon={<TrendingUp className="h-4 w-4" />}
currentValue={currentUserStats.longestWinStreak}
comparisonValues={comparisonStats.map(s => s.longestWinStreak)}
formatter={(v) => v.toString()}
higherIsBetter={true}
/>
<ComparisonRow
label="Current Streak"
icon={<TrendingUp className="h-4 w-4" />}
currentValue={currentUserStats.currentStreak.count}
comparisonValues={comparisonStats.map(s => s.currentStreak.count)}
formatter={(v, idx) => {
const streakType = idx === -1 
? currentUserStats.currentStreak.type 
: comparisonStats[idx].currentStreak.type;
return `${v} ${streakType === 'win' ? 'W' : streakType === 'loss' ? 'L' : '-'}`;
}}
higherIsBetter={true}
/>
</tbody>
</table>
</div>
</CardContent>
</Card>
</>
)}

{comparisonStats.length === 0 && (
<Card className="p-12 text-center">
<div className="flex flex-col items-center gap-4">
<div className="rounded-full bg-muted p-6">
<Users className="h-12 w-12 text-muted-foreground" />
</div>
<div>
<h3 className="text-lg font-semibold">No Players Selected</h3>
<p className="text-sm text-muted-foreground mt-1">
Select players above to compare your statistics
</p>
</div>
</div>
</Card>
)}
</div>
);
}

interface ComparisonRowProps {
label: string;
icon: React.ReactNode;
currentValue: number;
comparisonValues: number[];
formatter: (value: number, index: number) => string;
higherIsBetter: boolean;
}

function ComparisonRow({
label,
icon,
currentValue,
comparisonValues,
formatter,
higherIsBetter,
}: ComparisonRowProps) {
const allValues = [currentValue, ...comparisonValues];
const bestValue = higherIsBetter 
? Math.max(...allValues) 
: Math.min(...allValues);

const isBest = (value: number) => value === bestValue;

return (
<tr className="border-b border-border hover:bg-muted/50">
<td className="py-3 px-4">
<div className="flex items-center gap-2">
{icon}
<span className="text-sm font-medium">{label}</span>
</div>
</td>
<td className="text-center py-3 px-4 bg-green-50 dark:bg-green-950">
<div className="flex items-center justify-center gap-2">
<span className={cn(
'text-sm font-semibold',
isBest(currentValue) && 'text-green-600'
)}>
{formatter(currentValue, -1)}
</span>
{isBest(currentValue) && (
<Trophy className="h-4 w-4 text-green-600" />
)}
</div>
</td>
{comparisonValues.map((value, index) => (
<td key={index} className="text-center py-3 px-4">
<div className="flex items-center justify-center gap-2">
<span className={cn(
'text-sm font-semibold',
isBest(value) && 'text-green-600'
)}>
{formatter(value, index)}
</span>
{isBest(value) && (
<Trophy className="h-4 w-4 text-green-600" />
)}
</div>
</td>
))}
</tr>
);
}