import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Trophy, Target, DollarSign, Calendar, BarChart3, PieChart as PieChartIcon, Activity, Award, Flame, ArrowDown, ArrowUp, Minus as MinusIcon, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { fetchMatches } from '@/lib/api/matches.client';
import { fetchProfile, fetchCurrentUser, fetchProfiles } from '@/lib/api/users.client';
import { fetchScorecards } from '@/lib/api/scorecards.client';
import { Match, Profile, Course, Tee, Scorecard } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { centsToDisplay } from '@/lib/money';
import {
  calculateMatchOutcome,
  calculateTimeSeriesStatistics,
  calculateFormatStatistics,
  calculateCourseStatistics,
  calculateMonthlyStatistics,
  calculatePerformanceMetrics,
  calculateHandicapProgression,
  calculateHandicapTrend,
  MatchStatistic,
  FormatStatistic,
  CourseStatistic,
  MonthlyStatistic,
  PerformanceMetrics,
  HandicapProgressionData,
  HandicapTrend,
} from '@/lib/statistics';
import { PlayerComparison } from '@/components/statistics/PlayerComparison';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = {
  primary: '#16a34a',
  secondary: '#3b82f6',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
};

type ViewMode = 'personal' | 'comparison';

export function StatisticsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('90');
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [allPlayers, setAllPlayers] = useState<Profile[]>([]);

  const [matchData, setMatchData] = useState<Array<{
    match: Match;
    course: Course;
    tee: Tee;
    players: Profile[];
    scorecards: Scorecard[];
    outcome: 'won' | 'lost' | 'tied';
    winnings: number;
  }>>([]);

  const [timeSeriesData, setTimeSeriesData] = useState<MatchStatistic[]>([]);
  const [formatData, setFormatData] = useState<FormatStatistic[]>([]);
  const [courseData, setCourseData] = useState<CourseStatistic[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyStatistic[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [handicapData, setHandicapData] = useState<HandicapProgressionData[]>([]);
  const [handicapTrend, setHandicapTrend] = useState<HandicapTrend | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    if (matchData.length > 0) {
      const days = parseInt(timeRange);
      const timeSeries = calculateTimeSeriesStatistics(matchData, days);
      setTimeSeriesData(timeSeries);
    }
  }, [matchData, timeRange]);

  async function loadStatistics() {
    setLoading(true);
    try {
      const user = await fetchCurrentUser();
      if (!user) {
        navigate('/');
        return;
      }
      setCurrentUser(user);

      // Load all players for comparison
      const profiles = await fetchProfiles();
      setAllPlayers(profiles);

      const progression = calculateHandicapProgression(user.handicapHistory);
      setHandicapData(progression);

      const trend = calculateHandicapTrend(user.handicapHistory);
      setHandicapTrend(trend);

      const allMatches = await fetchMatches();
      const completedMatches = allMatches.filter(
        m => (m.status === 'completed' || m.status === 'settled') && m.playerIds.includes(user.id)
      );

      const data: typeof matchData = [];
      for (const match of completedMatches) {
        const course = mockDb.getCourse(match.courseId);
        const tee = mockDb.getTee(match.teeId);
        if (!course || !tee) continue;

        const players = await Promise.all(
          match.playerIds.map(id => fetchProfile(id))
        );
        const validPlayers = players.filter(Boolean) as Profile[];

        const scorecards = await fetchScorecards(match.id);
        const outcome = calculateMatchOutcome(match, tee, validPlayers, scorecards, user.id);

        data.push({
          match,
          course,
          tee,
          players: validPlayers,
          scorecards,
          outcome: outcome.result,
          winnings: outcome.winnings,
        });
      }

      setMatchData(data);

      const timeSeries = calculateTimeSeriesStatistics(data, parseInt(timeRange));
      setTimeSeriesData(timeSeries);

      const formats = calculateFormatStatistics(data);
      setFormatData(formats);

      const courses = calculateCourseStatistics(data);
      setCourseData(courses);

      const monthly = calculateMonthlyStatistics(data);
      setMonthlyData(monthly);

      const performanceMetrics = calculatePerformanceMetrics(data);
      setMetrics(performanceMetrics);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!currentUser || !metrics) {
    return (
      <div className="container py-8">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold">No Statistics Available</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Complete some matches to see your statistics
          </p>
        </Card>
      </div>
    );
  }

  const outcomeData = [
    { name: 'Wins', value: metrics.totalWins, color: COLORS.success },
    { name: 'Losses', value: metrics.totalLosses, color: COLORS.danger },
    { name: 'Ties', value: metrics.totalTies, color: COLORS.warning },
  ];

  // Get players user has played with for comparison
  const playedWithPlayers = allPlayers.filter(player => 
    player.id !== currentUser.id &&
    matchData.some(m => m.players.some(p => p.id === player.id))
  );

  const currentUserStats = {
    player: currentUser,
    totalMatches: metrics.totalMatches,
    totalWins: metrics.totalWins,
    totalLosses: metrics.totalLosses,
    totalTies: metrics.totalTies,
    winRate: metrics.winRate,
    totalWinnings: metrics.totalWinnings,
    avgWinningsPerMatch: metrics.avgWinningsPerMatch,
    bestWin: metrics.bestWin,
    currentStreak: metrics.currentStreak,
    longestWinStreak: metrics.longestWinStreak,
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Statistics</h1>
            <p className="text-muted-foreground">
              Advanced analytics and insights into your golf match performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            {viewMode === 'personal' && (
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2 p-1 rounded-lg bg-muted">
              <Button
                variant={viewMode === 'personal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('personal')}
                className={viewMode === 'personal' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Personal Stats
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                className={viewMode === 'comparison' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Users className="mr-2 h-4 w-4" />
                Compare Players
              </Button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'comparison' ? (
        <PlayerComparison
          currentUser={currentUser}
          currentUserStats={currentUserStats}
          availablePlayers={playedWithPlayers}
          allMatchData={matchData}
        />
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Win Rate
                </CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {metrics.winRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {metrics.totalWins}W - {metrics.totalLosses}L - {metrics.totalTies}T
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Winnings
                </CardDescription>
                <CardTitle className={cn(
                  'text-3xl',
                  metrics.totalWinnings > 0 ? 'text-green-600' : metrics.totalWinnings < 0 ? 'text-red-600' : ''
                )}>
                  {metrics.totalWinnings > 0 ? '+' : ''}{centsToDisplay(metrics.totalWinnings)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Avg: {centsToDisplay(metrics.avgWinningsPerMatch)} per match
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  Current Streak
                </CardDescription>
                <CardTitle className={cn(
                  'text-3xl',
                  metrics.currentStreak.type === 'win' ? 'text-green-600' : 
                  metrics.currentStreak.type === 'loss' ? 'text-red-600' : ''
                )}>
                  {metrics.currentStreak.count}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {metrics.currentStreak.type === 'win' ? 'Win' : 
                  metrics.currentStreak.type === 'loss' ? 'Loss' : 'No'} streak
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Best Win
                </CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {centsToDisplay(metrics.bestWin)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Single match record
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Handicap Progression */}
          {handicapData.length > 0 && handicapTrend && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Handicap Index Progression
                    </CardTitle>
                    <CardDescription>
                      Track your handicap index changes over the past year
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={handicapTrend.trend === 'improving' ? 'default' : handicapTrend.trend === 'regressing' ? 'destructive' : 'secondary'}
                    className="text-sm"
                  >
                    {handicapTrend.trend === 'improving' && <ArrowDown className="mr-1 h-4 w-4" />}
                    {handicapTrend.trend === 'regressing' && <ArrowUp className="mr-1 h-4 w-4" />}
                    {handicapTrend.trend === 'stable' && <MinusIcon className="mr-1 h-4 w-4" />}
                    {handicapTrend.trend === 'improving' ? 'Improving' : handicapTrend.trend === 'regressing' ? 'Regressing' : 'Stable'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">Current Index</p>
                    <p className="text-2xl font-bold">{handicapTrend.current.toFixed(1)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">Starting Index</p>
                    <p className="text-2xl font-bold">{handicapTrend.starting.toFixed(1)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">Change</p>
                    <p className={cn(
                      'text-2xl font-bold',
                      handicapTrend.change < 0 ? 'text-green-600' : handicapTrend.change > 0 ? 'text-red-600' : ''
                    )}>
                      {handicapTrend.change > 0 ? '+' : ''}{handicapTrend.change.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">Best Index</p>
                    <p className="text-2xl font-bold text-green-600">{handicapTrend.lowestHandicap.toFixed(1)}</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={handicapData}>
                    <defs>
                      <linearGradient id="colorHandicap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={handicapTrend.trend === 'improving' ? COLORS.success : COLORS.danger} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={handicapTrend.trend === 'improving' ? COLORS.success : COLORS.danger} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      domain={['dataMin - 1', 'dataMax + 1']}
                      reversed={true}
                      label={{ value: 'Handicap Index (Lower is Better)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [value.toFixed(1), 'Handicap Index']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="handicapIndex" 
                      stroke={handicapTrend.trend === 'improving' ? COLORS.success : COLORS.danger}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorHandicap)"
                    />
                  </AreaChart>
                </ResponsiveContainer>

                <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                    💡 Understanding Your Handicap Progression
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {handicapTrend.trend === 'improving' && 
                      `Great job! Your handicap has improved by ${Math.abs(handicapTrend.change).toFixed(1)} strokes over the past year. Keep up the excellent work!`
                    }
                    {handicapTrend.trend === 'regressing' && 
                      `Your handicap has increased by ${Math.abs(handicapTrend.change).toFixed(1)} strokes. Consider practicing more or taking lessons to get back on track.`
                    }
                    {handicapTrend.trend === 'stable' && 
                      `Your handicap has remained relatively stable. Consistency is key! Focus on specific areas to see improvement.`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cumulative Winnings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Cumulative Winnings Over Time
              </CardTitle>
              <CardDescription>
                Track your total winnings progression over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorWinnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [centsToDisplay(value), 'Cumulative Winnings']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeWinnings" 
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWinnings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Match Outcomes and Format Performance */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Match Outcomes
                </CardTitle>
                <CardDescription>
                  Distribution of wins, losses, and ties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={outcomeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance by Format
                </CardTitle>
                <CardDescription>
                  Win rates across different game formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="format" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                    />
                    <Bar dataKey="winRate" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Course */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance by Course
              </CardTitle>
              <CardDescription>
                Your win rate and earnings at different courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseData.slice(0, 5).map((course, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{course.courseName}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.matches} match{course.matches !== 1 ? 'es' : ''} • {course.wins}W-{course.losses}L
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {course.winRate.toFixed(0)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {centsToDisplay(course.totalWinnings)}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${course.winRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Performance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Performance Trends
              </CardTitle>
              <CardDescription>
                Matches played and winnings by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'winnings') {
                        return [centsToDisplay(value), 'Winnings'];
                      }
                      return [value, name === 'matches' ? 'Matches' : 'Wins'];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="matches" fill={COLORS.secondary} radius={[8, 8, 0, 0]} name="Matches" />
                  <Bar yAxisId="right" dataKey="winnings" fill={COLORS.primary} radius={[8, 8, 0, 0]} name="Winnings" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Streak Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'h-16 w-16 rounded-full flex items-center justify-center',
                    metrics.currentStreak.type === 'win' ? 'bg-green-100 dark:bg-green-900' :
                    metrics.currentStreak.type === 'loss' ? 'bg-red-100 dark:bg-red-900' :
                    'bg-gray-100 dark:bg-gray-800'
                  )}>
                    <Flame className={cn(
                      'h-8 w-8',
                      metrics.currentStreak.type === 'win' ? 'text-green-600' :
                      metrics.currentStreak.type === 'loss' ? 'text-red-600' :
                      'text-gray-600'
                    )} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{metrics.currentStreak.count}</p>
                    <p className="text-sm text-muted-foreground">
                      {metrics.currentStreak.type === 'win' ? 'Win' : 
                      metrics.currentStreak.type === 'loss' ? 'Loss' : 'No'} streak
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Longest Win Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600">{metrics.longestWinStreak}</p>
                    <p className="text-sm text-muted-foreground">consecutive wins</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Longest Loss Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">{metrics.longestLossStreak}</p>
                    <p className="text-sm text-muted-foreground">consecutive losses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}