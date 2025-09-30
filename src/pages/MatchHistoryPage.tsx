import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, MapPin, Calendar as CalendarIcon, DollarSign, Users, TrendingUp, TrendingDown, Minus, Filter, Clock, Award, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchMatches } from '@/lib/api/matches.client';
import { fetchProfile, fetchCurrentUser } from '@/lib/api/users.client';
import { fetchScorecards } from '@/lib/api/scorecards.client';
import { Match, Profile, Course, Tee, Scorecard } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { calculatePlayerHandicap, allocateStrokes } from '@/lib/handicap';
import { computeMatchPlayResult } from '@/lib/formats/matchPlay';
import { computeNetStrokeResult } from '@/lib/formats/netStroke';
import { centsToDisplay } from '@/lib/money';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface MatchHistoryItem {
  match: Match;
  course: Course;
  tee: Tee;
  players: Profile[];
  scorecards: Scorecard[];
  outcome: 'won' | 'lost' | 'tied';
  winnings: number;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function MatchHistoryPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [historyItems, setHistoryItems] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [minStakes, setMinStakes] = useState<string>('');
  const [maxStakes, setMaxStakes] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  
  // Sort state
  const [sortBy, setSortBy] = useState<string>('date-desc');

  useEffect(() => {
    loadMatchHistory();
  }, []);

  async function loadMatchHistory() {
    setLoading(true);
    try {
      const user = await fetchCurrentUser();
      if (!user) return;
      setCurrentUser(user);

      const allMatches = await fetchMatches();
      const completedMatches = allMatches.filter(
        m => (m.status === 'completed' || m.status === 'settled') && m.playerIds.includes(user.id)
      );

      const items: MatchHistoryItem[] = [];
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

        items.push({
          match,
          course,
          tee,
          players: validPlayers,
          scorecards,
          outcome: outcome.result,
          winnings: outcome.winnings,
        });
      }

      setHistoryItems(items);
    } finally {
      setLoading(false);
    }
  }

  function calculateMatchOutcome(
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

  // Get unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courseMap = new Map<string, Course>();
    historyItems.forEach(item => {
      if (!courseMap.has(item.course.id)) {
        courseMap.set(item.course.id, item.course);
      }
    });
    return Array.from(courseMap.values());
  }, [historyItems]);

  // Apply all filters
  const filteredItems = useMemo(() => {
    let filtered = [...historyItems];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.match.status === statusFilter);
    }

    // Format filter
    if (formatFilter !== 'all') {
      filtered = filtered.filter(item => item.match.format === formatFilter);
    }

    // Outcome filter
    if (outcomeFilter !== 'all') {
      filtered = filtered.filter(item => item.outcome === outcomeFilter);
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(item => item.course.id === courseFilter);
    }

    // Date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(item => {
        const matchDate = new Date(item.match.teeTimeISO);
        return isWithinInterval(matchDate, {
          start: startOfDay(dateRange.from!),
          end: endOfDay(dateRange.to!),
        });
      });
    }

    // Stakes range filter
    const minStakesCents = minStakes ? parseFloat(minStakes) * 100 : 0;
    const maxStakesCents = maxStakes ? parseFloat(maxStakes) * 100 : Infinity;
    if (minStakes || maxStakes) {
      filtered = filtered.filter(item => {
        return item.match.stakesCents >= minStakesCents && item.match.stakesCents <= maxStakesCents;
      });
    }

    return filtered;
  }, [historyItems, statusFilter, formatFilter, outcomeFilter, courseFilter, dateRange, minStakes, maxStakes]);

  // Apply sorting
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      const dateA = new Date(a.match.teeTimeISO).getTime();
      const dateB = new Date(b.match.teeTimeISO).getTime();

      if (sortBy === 'date-desc') return dateB - dateA;
      if (sortBy === 'date-asc') return dateA - dateB;
      if (sortBy === 'winnings-desc') return b.winnings - a.winnings;
      if (sortBy === 'winnings-asc') return a.winnings - b.winnings;
      return 0;
    });
    return sorted;
  }, [filteredItems, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, formatFilter, outcomeFilter, courseFilter, dateRange, minStakes, maxStakes, sortBy]);

  // Statistics
  const totalMatches = historyItems.length;
  const wins = historyItems.filter(item => item.outcome === 'won').length;
  const losses = historyItems.filter(item => item.outcome === 'lost').length;
  const ties = historyItems.filter(item => item.outcome === 'tied').length;
  const totalWinnings = historyItems.reduce((sum, item) => sum + item.winnings, 0);

  // Clear all filters
  function clearAllFilters() {
    setStatusFilter('all');
    setFormatFilter('all');
    setOutcomeFilter('all');
    setCourseFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setMinStakes('');
    setMaxStakes('');
    setSortBy('date-desc');
  }

  const hasActiveFilters = statusFilter !== 'all' || formatFilter !== 'all' || outcomeFilter !== 'all' || 
    courseFilter !== 'all' || dateRange.from || dateRange.to || minStakes || maxStakes;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Match History</h1>
        <p className="text-muted-foreground">
          View your completed matches and performance statistics
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Matches</CardDescription>
            <CardTitle className="text-3xl">{totalMatches}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              {wins}W - {losses}L - {ties}T
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Winnings</CardDescription>
            <CardTitle className={cn(
              'text-3xl',
              totalWinnings > 0 ? 'text-green-600' : totalWinnings < 0 ? 'text-red-600' : ''
            )}>
              {totalWinnings > 0 ? '+' : ''}{centsToDisplay(totalWinnings)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Net profit/loss
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Best Win</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {historyItems.length > 0
                ? centsToDisplay(Math.max(...historyItems.map(item => item.winnings), 0))
                : '$0.00'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Single match
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Panel */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary">{filteredItems.length} results</Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Format</Label>
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="match_play_net">Match Play</SelectItem>
                  <SelectItem value="net_stroke">Stroke Play</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Outcome Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Outcome</Label>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="won">Wins</SelectItem>
                  <SelectItem value="lost">Losses</SelectItem>
                  <SelectItem value="tied">Ties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                  {(dateRange.from || dateRange.to) && (
                    <div className="p-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setDateRange({ from: undefined, to: undefined })}
                      >
                        Clear Date Range
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Min Stakes Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Min Stakes ($)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={minStakes}
                onChange={(e) => setMinStakes(e.target.value)}
              />
            </div>

            {/* Max Stakes Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Stakes ($)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="10000"
                value={maxStakes}
                onChange={(e) => setMaxStakes(e.target.value)}
              />
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="winnings-desc">Highest Winnings</SelectItem>
                  <SelectItem value="winnings-asc">Lowest Winnings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, sortedItems.length)} of {sortedItems.length} matches
        </p>
        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6 per page</SelectItem>
            <SelectItem value="9">9 per page</SelectItem>
            <SelectItem value="12">12 per page</SelectItem>
            <SelectItem value="24">24 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Match Cards */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted" />
              <CardContent className="space-y-4 pt-6">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginatedItems.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-6">
              <Trophy className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No matches found</h3>
              <p className="text-sm text-muted-foreground">
                {historyItems.length === 0
                  ? "You haven't completed any matches yet"
                  : 'Try adjusting your filters'}
              </p>
            </div>
            {historyItems.length === 0 ? (
              <Link to="/">
                <Button className="bg-green-600 hover:bg-green-700">
                  Find a Match
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {paginatedItems.map(item => (
              <MatchHistoryCard key={item.match.id} item={item} currentUser={currentUser!} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <Button
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                        >
                          1
                        </Button>
                        {currentPage > 4 && <span className="text-muted-foreground">...</span>}
                      </>
                    )}

                    {/* Pages around current */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === currentPage || 
                               page === currentPage - 1 || 
                               page === currentPage + 1 ||
                               (page === currentPage - 2 && currentPage <= 3) ||
                               (page === currentPage + 2 && currentPage >= totalPages - 2);
                      })
                      .map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {page}
                        </Button>
                      ))}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="text-muted-foreground">...</span>}
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Page {currentPage} of {totalPages}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MatchHistoryCard({ item, currentUser }: { item: MatchHistoryItem; currentUser: Profile }) {
  const { match, course, tee, players, outcome, winnings } = item;
  const teeTime = new Date(match.teeTimeISO);

  const outcomeConfig = {
    won: {
      label: 'Victory',
      icon: <Trophy className="h-4 w-4" />,
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-700 dark:text-green-300',
      borderColor: 'border-green-600',
    },
    lost: {
      label: 'Defeat',
      icon: <TrendingDown className="h-4 w-4" />,
      bgColor: 'bg-red-100 dark:bg-red-900',
      textColor: 'text-red-700 dark:text-red-300',
      borderColor: 'border-red-600',
    },
    tied: {
      label: 'Tied',
      icon: <Minus className="h-4 w-4" />,
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-600',
    },
  };

  const config = outcomeConfig[outcome];

  return (
    <Link to={`/results/${match.id}`}>
      <Card className={cn(
        'overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2',
        config.borderColor
      )}>
        <div className="relative h-32 overflow-hidden">
          <img
            src={course.imageUrl || 'https://images.pexels.com/photos/914682/pexels-photo-914682.jpeg?auto=compress&cs=tinysrgb&w=800'}
            alt={course.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-semibold text-white line-clamp-1">{course.name}</h3>
            <p className="text-xs text-white/80 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {course.city}, {course.state}
            </p>
          </div>
          <div className="absolute top-3 right-3">
            <Badge className={cn(config.bgColor, config.textColor, 'border-0')}>
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
          </div>
        </div>

        <CardContent className="pt-4 space-y-4">
          {/* Date and Format */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              {format(teeTime, 'MMM d, yyyy')}
            </div>
            <Badge variant="outline" className="text-xs">
              {match.format === 'match_play_net' ? 'Match Play' : 'Stroke Play'}
            </Badge>
          </div>

          {/* Players */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {players.slice(0, 4).map(player => (
                <Avatar key={player.id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={player.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {player.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>

          {/* Stakes and Winnings */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Stakes: {centsToDisplay(match.stakesCents)}</span>
            </div>
            <div className={cn(
              'font-bold text-lg',
              winnings > 0 ? 'text-green-600' : winnings < 0 ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {winnings > 0 ? '+' : ''}{centsToDisplay(winnings)}
            </div>
          </div>

          {/* Status and View Link */}
          <div className="flex items-center justify-between">
            <Badge variant={match.status === 'settled' ? 'default' : 'outline'} className="text-xs">
              {match.status === 'settled' ? (
                <>
                  <Clock className="mr-1 h-3 w-3" />
                  Settled
                </>
              ) : (
                'Completed'
              )}
            </Badge>
            <span className="text-xs text-muted-foreground">View Results →</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}