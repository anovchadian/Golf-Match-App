import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchMatch } from '@/lib/api/matches.client';
import { fetchProfile } from '@/lib/api/users.client';
import { fetchScorecards, createScorecard, updateScorecardEntry } from '@/lib/api/scorecards.client';
import { Match, Profile, Course, Tee, Scorecard, ScorecardEntry } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { calculatePlayerHandicap, allocateStrokes } from '@/lib/handicap';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PlayerScoreData {
  player: Profile;
  scorecard: Scorecard;
  handicap: number;
  strokes: number[];
}

export function ScorecardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [tee, setTee] = useState<Tee | null>(null);
  const [playerData, setPlayerData] = useState<PlayerScoreData[]>([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadScorecardData();
  }, [id]);

  async function loadScorecardData() {
    if (!id) return;

    setLoading(true);
    try {
      const matchData = await fetchMatch(id);
      if (!matchData) {
        toast({
          title: 'Match Not Found',
          description: 'The match you are looking for does not exist.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setMatch(matchData);

      const courseData = mockDb.getCourse(matchData.courseId);
      const teeData = mockDb.getTee(matchData.teeId);
      setCourse(courseData || null);
      setTee(teeData || null);

      if (!teeData) return;

      const players = await Promise.all(
        matchData.playerIds.map(playerId => fetchProfile(playerId))
      );

      let scorecards = await fetchScorecards(matchData.id);

      for (const player of players) {
        if (!player) continue;
        const existingScorecard = scorecards.find(sc => sc.userId === player.id);
        if (!existingScorecard) {
          const newScorecard = await createScorecard(matchData.id, player.id);
          scorecards.push(newScorecard);
        }
      }

      const playerHandicaps: { [userId: string]: number } = {};
      players.forEach(player => {
        if (!player) return;
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

      const data: PlayerScoreData[] = players
        .filter(Boolean)
        .map(player => {
          const scorecard = scorecards.find(sc => sc.userId === player!.id)!;
          return {
            player: player!,
            scorecard,
            handicap: playerHandicaps[player!.id],
            strokes: strokeAllocation[player!.id],
          };
        });

      setPlayerData(data);

      const firstIncompleteHole = findFirstIncompleteHole(data);
      setCurrentHole(firstIncompleteHole);
    } finally {
      setLoading(false);
    }
  }

  function findFirstIncompleteHole(data: PlayerScoreData[]): number {
    for (let hole = 1; hole <= 18; hole++) {
      const allPlayersHaveScore = data.every(pd =>
        pd.scorecard.entries.some(e => e.hole === hole)
      );
      if (!allPlayersHaveScore) {
        return hole;
      }
    }
    return 18;
  }

  async function handleScoreChange(playerId: string, hole: number, strokes: string) {
    const strokesNum = parseInt(strokes);
    if (isNaN(strokesNum) || strokesNum < 1 || strokesNum > 15) return;

    setSaving(true);
    try {
      const playerDataItem = playerData.find(pd => pd.player.id === playerId);
      if (!playerDataItem) return;

      const updatedScorecard = await updateScorecardEntry(
        playerDataItem.scorecard.id,
        hole,
        strokesNum
      );

      if (updatedScorecard) {
        setPlayerData(prev =>
          prev.map(pd =>
            pd.player.id === playerId ? { ...pd, scorecard: updatedScorecard } : pd
          )
        );
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save score',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function getScore(playerId: string, hole: number): number | undefined {
    const playerDataItem = playerData.find(pd => pd.player.id === playerId);
    if (!playerDataItem) return undefined;
    const entry = playerDataItem.scorecard.entries.find(e => e.hole === hole);
    return entry?.strokes;
  }

  function getNetScore(playerId: string, hole: number): number | undefined {
    const gross = getScore(playerId, hole);
    if (gross === undefined) return undefined;
    const playerDataItem = playerData.find(pd => pd.player.id === playerId);
    if (!playerDataItem) return undefined;
    const strokesReceived = playerDataItem.strokes[hole - 1] || 0;
    return gross - strokesReceived;
  }

  function getTotalScore(playerId: string): { gross: number; net: number; holes: number } {
    const playerDataItem = playerData.find(pd => pd.player.id === playerId);
    if (!playerDataItem) return { gross: 0, net: 0, holes: 0 };

    let gross = 0;
    let net = 0;
    let holes = 0;

    playerDataItem.scorecard.entries.forEach(entry => {
      gross += entry.strokes;
      const strokesReceived = playerDataItem.strokes[entry.hole - 1] || 0;
      net += entry.strokes - strokesReceived;
      holes++;
    });

    return { gross, net, holes };
  }

  function getScoreToPar(score: number, par: number): { value: number; label: string; color: string } {
    const diff = score - par;
    if (diff <= -2) return { value: diff, label: 'Eagle', color: 'text-yellow-600' };
    if (diff === -1) return { value: diff, label: 'Birdie', color: 'text-blue-600' };
    if (diff === 0) return { value: diff, label: 'Par', color: 'text-green-600' };
    if (diff === 1) return { value: diff, label: 'Bogey', color: 'text-orange-600' };
    return { value: diff, label: `+${diff}`, color: 'text-red-600' };
  }

  function handleFinishRound() {
    if (!id) return;
    
    const allScoresComplete = playerData.every(pd => pd.scorecard.entries.length === 18);
    
    if (!allScoresComplete) {
      toast({
        title: 'Incomplete Scores',
        description: 'Please complete all 18 holes before finishing the round.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Round Complete!',
      description: 'Calculating results...',
    });

    setTimeout(() => {
      navigate(`/results/${id}`);
    }, 1000);
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!match || !course || !tee) {
    return (
      <div className="container py-8">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Match Not Found</h3>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Back to Discover
          </Button>
        </Card>
      </div>
    );
  }

  const holePar = tee.par / 18;
  const holeYardage = Math.round(tee.yardage / 18);
  const allScoresComplete = playerData.every(pd => pd.scorecard.entries.length === 18);

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/match/${id}`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Match
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Scorecard</h1>
            <p className="text-muted-foreground">{course.name}</p>
          </div>
          {saving && (
            <Badge variant="outline" className="animate-pulse">
              <Save className="mr-1 h-3 w-3" />
              Saving...
            </Badge>
          )}
        </div>
      </div>

      {/* Hole Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Hole</p>
              <p className="text-2xl font-bold">Hole {currentHole}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Par {Math.round(holePar)}</p>
              <p className="text-sm text-muted-foreground">{holeYardage} yards</p>
            </div>
          </div>

          <div className="grid grid-cols-9 gap-2">
            {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => {
              const allPlayersHaveScore = playerData.every(pd =>
                pd.scorecard.entries.some(e => e.hole === hole)
              );
              return (
                <button
                  key={hole}
                  onClick={() => setCurrentHole(hole)}
                  className={cn(
                    'aspect-square rounded-lg border-2 font-semibold transition-colors',
                    currentHole === hole
                      ? 'border-green-600 bg-green-600 text-white'
                      : allPlayersHaveScore
                      ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : 'border-border hover:border-green-300'
                  )}
                >
                  {hole}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Score Entry */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Hole {currentHole} Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {playerData.map(pd => {
            const grossScore = getScore(pd.player.id, currentHole);
            const netScore = getNetScore(pd.player.id, currentHole);
            const strokesReceived = pd.strokes[currentHole - 1] || 0;

            return (
              <div
                key={pd.player.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={pd.player.avatarUrl} />
                  <AvatarFallback>
                    {pd.player.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-semibold">{pd.player.displayName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>HI: {pd.player.handicapIndex}</span>
                    {strokesReceived > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {Array.from({ length: strokesReceived }).map((_, i) => (
                            <span key={i} className="h-2 w-2 rounded-full bg-green-600" />
                          ))}
                          <span className="ml-1">{strokesReceived} stroke{strokesReceived > 1 ? 's' : ''}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Gross</p>
                    <Input
                      type="number"
                      min="1"
                      max="15"
                      value={grossScore || ''}
                      onChange={(e) => handleScoreChange(pd.player.id, currentHole, e.target.value)}
                      className="w-16 h-12 text-center text-lg font-bold"
                      placeholder="-"
                    />
                  </div>

                  {strokesReceived > 0 && grossScore && (
                    <>
                      <Minus className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Strokes</p>
                        <div className="w-16 h-12 flex items-center justify-center text-lg font-bold text-green-600">
                          {strokesReceived}
                        </div>
                      </div>
                    </>
                  )}

                  {netScore !== undefined && (
                    <>
                      <span className="text-2xl text-muted-foreground">=</span>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Net</p>
                        <div className={cn(
                          'w-16 h-12 flex items-center justify-center text-lg font-bold rounded-lg border-2',
                          netScore < holePar ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          netScore === holePar ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' :
                          'border-orange-600 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                        )}>
                          {netScore}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Running Totals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Running Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playerData.map(pd => {
              const totals = getTotalScore(pd.player.id);
              const expectedPar = Math.round(holePar) * totals.holes;
              const netToPar = totals.net - expectedPar;

              return (
                <div
                  key={pd.player.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={pd.player.avatarUrl} />
                      <AvatarFallback>
                        {pd.player.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{pd.player.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {totals.holes} hole{totals.holes !== 1 ? 's' : ''} played
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Gross</p>
                      <p className="text-xl font-bold">{totals.gross}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Net</p>
                      <p className="text-xl font-bold text-green-600">{totals.net}</p>
                    </div>

                    <div className="text-center min-w-[80px]">
                      <p className="text-xs text-muted-foreground">To Par</p>
                      <div className="flex items-center justify-center gap-1">
                        {netToPar < 0 ? (
                          <>
                            <TrendingDown className="h-4 w-4 text-blue-600" />
                            <p className="text-xl font-bold text-blue-600">{netToPar}</p>
                          </>
                        ) : netToPar === 0 ? (
                          <>
                            <Minus className="h-4 w-4 text-green-600" />
                            <p className="text-xl font-bold text-green-600">E</p>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 text-orange-600" />
                            <p className="text-xl font-bold text-orange-600">+{netToPar}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentHole(prev => Math.max(1, prev - 1))}
          disabled={currentHole === 1}
        >
          Previous Hole
        </Button>
        
        {allScoresComplete ? (
          <Button
            onClick={handleFinishRound}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finish Round & View Results
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentHole(prev => Math.min(18, prev + 1))}
            disabled={currentHole === 18}
            className="bg-green-600 hover:bg-green-700"
          >
            Next Hole
          </Button>
        )}
      </div>
    </div>
  );
}