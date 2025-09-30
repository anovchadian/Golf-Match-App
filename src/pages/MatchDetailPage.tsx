import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Trophy, DollarSign, Users, Clock, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchMatch, joinMatch } from '@/lib/api/matches.client';
import { fetchProfile, fetchCurrentUser } from '@/lib/api/users.client';
import { Match, Profile, Course, Tee } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { centsToDisplay } from '@/lib/money';
import { calculatePlayerHandicap } from '@/lib/handicap';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [tee, setTee] = useState<Tee | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadMatchData();
    loadCurrentUser();
  }, [id]);

  async function loadCurrentUser() {
    const user = await fetchCurrentUser();
    setCurrentUser(user);
  }

  async function loadMatchData() {
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

      const playerProfiles = await Promise.all(
        matchData.playerIds.map(playerId => fetchProfile(playerId))
      );
      setPlayers(playerProfiles.filter(Boolean) as Profile[]);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinMatch() {
    if (!match || !currentUser) return;

    setJoining(true);
    try {
      const updatedMatch = await joinMatch(match.id, currentUser.id);
      if (updatedMatch) {
        setMatch(updatedMatch);
        const playerProfiles = await Promise.all(
          updatedMatch.playerIds.map(playerId => fetchProfile(playerId))
        );
        setPlayers(playerProfiles.filter(Boolean) as Profile[]);

        toast({
          title: 'Successfully Joined!',
          description: 'You have joined the match. Good luck!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join match',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
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
          <p className="text-sm text-muted-foreground mt-2">
            The match you are looking for does not exist.
          </p>
          <Link to="/">
            <Button className="mt-4">Back to Discover</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const teeTime = new Date(match.teeTimeISO);
  const spotsLeft = match.maxPlayers - match.playerIds.length;
  const isUserInMatch = currentUser && match.playerIds.includes(currentUser.id);
  const canJoin = match.status === 'open' && !isUserInMatch && spotsLeft > 0;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discover
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Image */}
          <Card className="overflow-hidden">
            <div className="relative h-64">
              <img
                src={course.imageUrl || 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg?auto=compress&cs=tinysrgb&w=1200'}
                alt={course.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <Badge
                  variant={match.status === 'open' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {match.status === 'open'
                    ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`
                    : match.status}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">{course.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-base">
                <MapPin className="h-4 w-4" />
                {course.address}, {course.city}, {course.state}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Match Details */}
          <Card>
            <CardHeader>
              <CardTitle>Match Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tee Time */}
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">Tee Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(teeTime, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(teeTime, 'h:mm a')}
                  </p>
                </div>
              </div>

              {/* Tee Set */}
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
                  <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Tee Set</p>
                  <p className="text-sm text-muted-foreground">
                    {tee.name} ({tee.color})
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Rating:</span>{' '}
                      <span className="font-medium">{tee.rating}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Slope:</span>{' '}
                      <span className="font-medium">{tee.slope}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Par:</span>{' '}
                      <span className="font-medium">{tee.par}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Yardage:</span>{' '}
                      <span className="font-medium">{tee.yardage}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Format */}
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3">
                  <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold">Format</p>
                  <p className="text-sm text-muted-foreground">
                    {match.format === 'match_play_net' ? 'Match Play (Net)' : 'Stroke Play (Net)'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {match.options.skins && (
                      <Badge variant="outline" className="text-xs">
                        Skins
                      </Badge>
                    )}
                    {match.options.nassau && (
                      <Badge variant="outline" className="text-xs">
                        Nassau
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Stakes */}
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">Stakes</p>
                  <p className="text-2xl font-bold text-green-600">
                    {centsToDisplay(match.stakesCents)}
                  </p>
                  <p className="text-sm text-muted-foreground">per player</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total pot: {centsToDisplay(match.stakesCents * match.maxPlayers)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Join/Scorecard Actions */}
          {match.status === 'open' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Join This Match
                </CardTitle>
                <CardDescription>
                  {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isUserInMatch ? (
                  <div className="rounded-lg border-2 border-green-600 bg-green-50 dark:bg-green-950 p-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">You're in this match!</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Entry Fee</span>
                        <span className="font-semibold">{centsToDisplay(match.stakesCents)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Potential Winnings</span>
                        <span className="font-semibold text-green-600">
                          {centsToDisplay(match.stakesCents * match.maxPlayers)}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={handleJoinMatch}
                      disabled={!canJoin || joining}
                    >
                      {joining ? 'Joining...' : 'Join Match'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By joining, you agree to the match terms and stakes
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {match.status === 'in_progress' && isUserInMatch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Scorecard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`/score/${match.id}`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                    Enter Scores
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({players.length}/{match.maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {players.map((player) => {
                const handicapInfo = calculatePlayerHandicap(
                  player.handicapIndex,
                  tee.slope,
                  tee.rating,
                  tee.par,
                  match.format
                );

                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={player.avatarUrl} />
                      <AvatarFallback>
                        {player.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{player.displayName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>HI: {player.handicapIndex}</span>
                        <span>•</span>
                        <span>CH: {handicapInfo.courseHandicap}</span>
                        <span>•</span>
                        <span>PH: {handicapInfo.playingHandicap}</span>
                      </div>
                    </div>
                    {player.verified && (
                      <Badge variant="outline" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                );
              })}

              {/* Empty Spots */}
              {Array.from({ length: spotsLeft }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-muted"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-muted-foreground">Open Spot</p>
                    <p className="text-sm text-muted-foreground">Waiting for player</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Match Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Match Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Match ID</span>
                <span className="font-mono text-xs">{match.id.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(match.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={match.status === 'open' ? 'default' : 'secondary'}>
                  {match.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}