import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, DollarSign, TrendingUp, TrendingDown, Minus, Award, Users, Target, CheckCircle, Wallet as WalletIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchMatch, updateMatchStatus } from '@/lib/api/matches.client';
import { fetchProfile } from '@/lib/api/users.client';
import { fetchScorecards } from '@/lib/api/scorecards.client';
import { Match, Profile, Course, Tee, Scorecard } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { calculatePlayerHandicap, allocateStrokes } from '@/lib/handicap';
import { computeMatchPlayResult } from '@/lib/formats/matchPlay';
import { computeNetStrokeResult } from '@/lib/formats/netStroke';
import { computeSkins } from '@/lib/formats/skins';
import { computeNassau } from '@/lib/formats/nassau';
import { centsToDisplay } from '@/lib/money';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PlayerResult {
  player: Profile;
  grossTotal: number;
  netTotal: number;
  holesCompleted: number;
  winnings: number;
}

interface Settlement {
  from: Profile;
  to: Profile;
  amount: number;
}

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [tee, setTee] = useState<Tee | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadResultsData();
  }, [id]);

  async function loadResultsData() {
    if (!id) return;

    setLoading(true);
    try {
      const matchData = await fetchMatch(id);
      if (!matchData) {
        navigate('/');
        return;
      }

      setMatch(matchData);

      const courseData = mockDb.getCourse(matchData.courseId);
      const teeData = mockDb.getTee(matchData.teeId);
      setCourse(courseData || null);
      setTee(teeData || null);

      const playerProfiles = await Promise.all(
        matchData.playerIds.map(playerId => fetchProfile(playerId))
      );
      const validPlayers = playerProfiles.filter(Boolean) as Profile[];
      setPlayers(validPlayers);

      const scorecardsData = await fetchScorecards(matchData.id);
      setScorecards(scorecardsData);

      if (teeData && scorecardsData.length > 0) {
        calculateResults(matchData, teeData, validPlayers, scorecardsData);
      }
    } finally {
      setLoading(false);
    }
  }

  function calculateResults(
    matchData: Match,
    teeData: Tee,
    playerProfiles: Profile[],
    scorecardsData: Scorecard[]
  ) {
    // Calculate handicaps and stroke allocation
    const playerHandicaps: { [userId: string]: number } = {};
    playerProfiles.forEach(player => {
      const handicapInfo = calculatePlayerHandicap(
        player.handicapIndex,
        teeData.slope,
        teeData.rating,
        teeData.par,
        matchData.format
      );
      playerHandicaps[player.id] = handicapInfo.playingHandicap;
    });

    const strokeAllocation = allocateStrokes(playerHandicaps, teeData.strokeIndex);

    // Calculate scores
    const results: PlayerResult[] = playerProfiles.map(player => {
      const scorecard = scorecardsData.find(sc => sc.userId === player.id);
      let grossTotal = 0;
      let netTotal = 0;
      let holesCompleted = 0;

      if (scorecard) {
        scorecard.entries.forEach(entry => {
          grossTotal += entry.strokes;
          const strokesReceived = strokeAllocation[player.id][entry.hole - 1] || 0;
          netTotal += entry.strokes - strokesReceived;
          holesCompleted++;
        });
      }

      return {
        player,
        grossTotal,
        netTotal,
        holesCompleted,
        winnings: 0,
      };
    });

    // Calculate winnings
    const winningsMap: { [userId: string]: number } = {};
    playerProfiles.forEach(p => winningsMap[p.id] = 0);

    // Main format winnings
    if (matchData.format === 'match_play_net' && scorecardsData.length === 2) {
      const matchPlayResult = computeMatchPlayResult(scorecardsData, strokeAllocation);
      if (matchPlayResult.winner) {
        winningsMap[matchPlayResult.winner] += matchData.stakesCents;
      }
    } else if (matchData.format === 'net_stroke') {
      const strokeResult = computeNetStrokeResult(scorecardsData, strokeAllocation);
      if (strokeResult.winner) {
        const totalPot = matchData.stakesCents * playerProfiles.length;
        winningsMap[strokeResult.winner] += totalPot;
      }
    }

    // Skins winnings
    if (matchData.options.skins) {
      const skinsResult = computeSkins(scorecardsData, strokeAllocation);
      const totalSkins = Object.values(skinsResult.winners).reduce((a, b) => a + b, 0);
      if (totalSkins > 0) {
        const skinValue = matchData.stakesCents / totalSkins;
        Object.entries(skinsResult.winners).forEach(([userId, skins]) => {
          winningsMap[userId] += skins * skinValue;
        });
      }
    }

    // Nassau winnings
    if (matchData.options.nassau && matchData.format === 'match_play_net' && scorecardsData.length === 2) {
      const nassauResult = computeNassau(scorecardsData, strokeAllocation, matchData.stakesCents);
      if (nassauResult.front.winner) {
        winningsMap[nassauResult.front.winner] += nassauResult.front.amount;
      }
      if (nassauResult.back.winner) {
        winningsMap[nassauResult.back.winner] += nassauResult.back.amount;
      }
      if (nassauResult.overall.winner) {
        winningsMap[nassauResult.overall.winner] += nassauResult.overall.amount;
      }
    }

    results.forEach(result => {
      result.winnings = winningsMap[result.player.id];
    });

    setPlayerResults(results);

    // Calculate settlements
    const settlementsData: Settlement[] = [];
    results.forEach(result => {
      const netAmount = result.winnings - matchData.stakesCents;
      if (netAmount > 0) {
        // This player won money
        results.forEach(otherResult => {
          if (otherResult.player.id !== result.player.id) {
            const otherNetAmount = otherResult.winnings - matchData.stakesCents;
            if (otherNetAmount < 0) {
              // Other player lost money
              const amountOwed = Math.min(netAmount, Math.abs(otherNetAmount));
              if (amountOwed > 0) {
                settlementsData.push({
                  from: otherResult.player,
                  to: result.player,
                  amount: amountOwed,
                });
              }
            }
          }
        });
      }
    });

    setSettlements(settlementsData);
  }

  async function handleProcessSettlement() {
    if (!match || !id) return;

    setProcessing(true);
    try {
      // Process each player's settlement
      for (const result of playerResults) {
        const netAmount = result.winnings - match.stakesCents;
        
        if (netAmount > 0) {
          // Player won - add payout transaction
          mockDb.addTransaction(result.player.id, {
            userId: result.player.id,
            type: 'payout',
            amountCents: netAmount,
            matchId: match.id,
            status: 'completed',
          });
        } else if (netAmount < 0) {
          // Player lost - deduct from balance (already in escrow)
          // No additional transaction needed as escrow was taken when joining
        }
      }

      // Update match status to settled
      await updateMatchStatus(match.id, 'settled');
      
      toast({
        title: 'Settlement Complete',
        description: 'All player balances have been updated.',
      });

      // Reload match data to show updated status
      await loadResultsData();
    } catch (error) {
      toast({
        title: 'Settlement Failed',
        description: error instanceof Error ? error.message : 'Failed to process settlement',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!match || !course || !tee || players.length === 0) {
    return (
      <div className="container py-8">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold">Results Not Available</h3>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Back to Discover
          </Button>
        </Card>
      </div>
    );
  }

  const winner = playerResults.reduce((prev, current) =>
    current.winnings > prev.winnings ? current : prev
  );

  const isSettled = match.status === 'settled';

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/match/${id}`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Match
        </Button>
      </div>

      {/* Winner Banner */}
      <Card className="mb-6 overflow-hidden border-2 border-green-600">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="h-12 w-12" />
            <h1 className="text-4xl font-bold">Match Complete!</h1>
            <Trophy className="h-12 w-12" />
          </div>
          <div className="text-center">
            <p className="text-green-100 mb-2">Winner</p>
            <div className="flex items-center justify-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white">
                <AvatarImage src={winner.player.avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {winner.player.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-3xl font-bold">{winner.player.displayName}</p>
                <p className="text-xl text-green-100">
                  Won {centsToDisplay(winner.winnings - match.stakesCents)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Settlement Status */}
      {!isSettled && (
        <Card className="mb-6 border-2 border-orange-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <WalletIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Settlement Pending</p>
                  <p className="text-sm text-muted-foreground">
                    Process settlement to update all player wallets
                  </p>
                </div>
              </div>
              <Button
                onClick={handleProcessSettlement}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {processing ? (
                  'Processing...'
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Process Settlement
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isSettled && (
        <Card className="mb-6 border-2 border-green-600">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-lg text-green-900 dark:text-green-100">
                  Settlement Complete
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All player wallets have been updated
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Match Summary
          </CardTitle>
          <CardDescription>{course.name} - {tee.name} Tees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Format</p>
              <p className="font-semibold">
                {match.format === 'match_play_net' ? 'Match Play' : 'Stroke Play'}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Stakes</p>
              <p className="font-semibold">{centsToDisplay(match.stakesCents)}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Total Pot</p>
              <p className="font-semibold text-green-600">
                {centsToDisplay(match.stakesCents * players.length)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Players</p>
              <p className="font-semibold">{players.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Scores */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Final Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playerResults
              .sort((a, b) => b.winnings - a.winnings)
              .map((result, index) => {
                const netAmount = result.winnings - match.stakesCents;
                const isWinner = index === 0;

                return (
                  <div
                    key={result.player.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border-2',
                      isWinner
                        ? 'border-green-600 bg-green-50 dark:bg-green-950'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={result.player.avatarUrl} />
                          <AvatarFallback>
                            {result.player.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isWinner && (
                          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{result.player.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          HI: {result.player.handicapIndex}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Gross</p>
                        <p className="text-xl font-bold">{result.grossTotal}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Net</p>
                        <p className="text-xl font-bold text-green-600">{result.netTotal}</p>
                      </div>

                      <div className="text-center min-w-[100px]">
                        <p className="text-xs text-muted-foreground">Winnings</p>
                        <p
                          className={cn(
                            'text-xl font-bold',
                            netAmount > 0
                              ? 'text-green-600'
                              : netAmount < 0
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                          )}
                        >
                          {netAmount > 0 ? '+' : ''}
                          {centsToDisplay(netAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Settlement Breakdown */}
      {settlements.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Settlement Breakdown
            </CardTitle>
            <CardDescription>Who owes whom</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={settlement.from.avatarUrl} />
                      <AvatarFallback>
                        {settlement.from.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{settlement.from.displayName}</p>
                      <p className="text-sm text-muted-foreground">Owes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center px-6 py-2 rounded-lg bg-red-100 dark:bg-red-950">
                      <p className="text-2xl font-bold text-red-600">
                        {centsToDisplay(settlement.amount)}
                      </p>
                    </div>
                    <div className="text-muted-foreground">→</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-right">{settlement.to.displayName}</p>
                      <p className="text-sm text-muted-foreground text-right">Receives</p>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={settlement.to.avatarUrl} />
                      <AvatarFallback>
                        {settlement.to.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                💡 Settlement Tip
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {isSettled 
                  ? 'Settlements have been processed. Check your wallet for updated balance.'
                  : 'Click "Process Settlement" above to automatically update all player wallets.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Play Breakdown */}
      {match.format === 'match_play_net' && scorecards.length === 2 && (
        <MatchPlayBreakdown
          scorecards={scorecards}
          players={players}
          tee={tee}
          match={match}
        />
      )}

      {/* Skins Breakdown */}
      {match.options.skins && (
        <SkinsBreakdown
          scorecards={scorecards}
          players={players}
          tee={tee}
          match={match}
        />
      )}

      {/* Nassau Breakdown */}
      {match.options.nassau && match.format === 'match_play_net' && scorecards.length === 2 && (
        <NassauBreakdown
          scorecards={scorecards}
          players={players}
          tee={tee}
          match={match}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link to="/wallet" className="flex-1">
          <Button variant="outline" className="w-full">
            <WalletIcon className="mr-2 h-4 w-4" />
            View Wallet
          </Button>
        </Link>
        <Link to="/" className="flex-1">
          <Button className="w-full bg-green-600 hover:bg-green-700">
            Find Another Match
          </Button>
        </Link>
      </div>
    </div>
  );
}

function MatchPlayBreakdown({
  scorecards,
  players,
  tee,
  match,
}: {
  scorecards: Scorecard[];
  players: Profile[];
  tee: Tee;
  match: Match;
}) {
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
  const result = computeMatchPlayResult(scorecards, strokeAllocation);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Match Play Results</CardTitle>
        <CardDescription>Hole-by-hole breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-9 gap-2 mb-4">
          {result.holes.slice(0, 9).map((hole) => (
            <div
              key={hole.hole}
              className={cn(
                'aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold',
                hole.result === 'W'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : hole.result === 'L'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              )}
            >
              <span className="text-xs">{hole.hole}</span>
              <span className="text-lg">{hole.result}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-9 gap-2 mb-4">
          {result.holes.slice(9, 18).map((hole) => (
            <div
              key={hole.hole}
              className={cn(
                'aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold',
                hole.result === 'W'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : hole.result === 'L'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              )}
            >
              <span className="text-xs">{hole.hole}</span>
              <span className="text-lg">{hole.result}</span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground mb-2">Final Result</p>
          <p className="text-xl font-bold">
            {result.winner
              ? `${players.find(p => p.id === result.winner)?.displayName} wins ${Math.abs(result.upDownHistory[17])} up`
              : 'Match Tied'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SkinsBreakdown({
  scorecards,
  players,
  tee,
  match,
}: {
  scorecards: Scorecard[];
  players: Profile[];
  tee: Tee;
  match: Match;
}) {
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
  const result = computeSkins(scorecards, strokeAllocation);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Skins Results</CardTitle>
        <CardDescription>Skins won by hole</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {result.holes.map((hole) => (
            <div
              key={hole.hole}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                  {hole.hole}
                </div>
                <span className="text-sm">
                  {hole.winner
                    ? players.find(p => p.id === hole.winner)?.displayName
                    : 'Tied - Carry over'}
                </span>
              </div>
              <Badge variant={hole.winner ? 'default' : 'outline'}>
                {hole.carryover} skin{hole.carryover > 1 ? 's' : ''}
              </Badge>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-muted space-y-2">
          <p className="text-sm text-muted-foreground mb-2">Total Skins Won</p>
          {Object.entries(result.winners).map(([userId, skins]) => (
            <div key={userId} className="flex justify-between">
              <span className="font-semibold">
                {players.find(p => p.id === userId)?.displayName}
              </span>
              <span className="font-bold text-green-600">{skins} skins</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NassauBreakdown({
  scorecards,
  players,
  tee,
  match,
}: {
  scorecards: Scorecard[];
  players: Profile[];
  tee: Tee;
  match: Match;
}) {
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
  const result = computeNassau(scorecards, strokeAllocation, match.stakesCents);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Nassau Results</CardTitle>
        <CardDescription>Three separate bets: Front 9, Back 9, Overall 18</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Front Nine</p>
                <p className="text-sm text-muted-foreground">Holes 1-9</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{centsToDisplay(result.front.amount)}</p>
                <p className="text-sm">
                  {result.front.winner
                    ? players.find(p => p.id === result.front.winner)?.displayName
                    : 'Tied'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Back Nine</p>
                <p className="text-sm text-muted-foreground">Holes 10-18</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{centsToDisplay(result.back.amount)}</p>
                <p className="text-sm">
                  {result.back.winner
                    ? players.find(p => p.id === result.back.winner)?.displayName
                    : 'Tied'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 border-green-600 bg-green-50 dark:bg-green-950">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">Overall 18</p>
                <p className="text-sm text-green-700 dark:text-green-300">Full round</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-2xl text-green-600">
                  {centsToDisplay(result.overall.amount)}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {result.overall.winner
                    ? players.find(p => p.id === result.overall.winner)?.displayName
                    : 'Tied'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}