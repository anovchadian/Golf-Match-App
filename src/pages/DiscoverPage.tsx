import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, DollarSign, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchMatches } from '@/lib/api/matches.client';
import { fetchProfile } from '@/lib/api/users.client';
import { Match, Profile, Course, Tee } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { centsToDisplay } from '@/lib/money';
import { format } from 'date-fns';
import { calculatePlayerHandicap } from '@/lib/handicap';

export function DiscoverPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadMatches();
  }, [statusFilter]);

  async function loadMatches() {
    setLoading(true);
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await fetchMatches(filters);
      setMatches(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discover Matches</h1>
            <p className="text-muted-foreground">
              Find and join money matches at courses near you
            </p>
          </div>
          <Link to="/create">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Create Match
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Matches</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-48 bg-muted" />
                <CardContent className="space-y-4 pt-6">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-6">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No matches found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or create a new match
                </p>
              </div>
              <Link to="/create">
                <Button className="bg-green-600 hover:bg-green-700">
                  Create Your First Match
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [tee, setTee] = useState<Tee | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);

  useEffect(() => {
    const courseData = mockDb.getCourse(match.courseId);
    const teeData = mockDb.getTee(match.teeId);
    setCourse(courseData || null);
    setTee(teeData || null);

    Promise.all(match.playerIds.map(id => fetchProfile(id))).then(profiles => {
      setPlayers(profiles.filter(Boolean) as Profile[]);
    });
  }, [match]);

  if (!course || !tee) return null;

  const spotsLeft = match.maxPlayers - match.playerIds.length;
  const teeTime = new Date(match.teeTimeISO);

  return (
    <Link to={`/match/${match.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg cursor-pointer">
        <div className="relative h-48 overflow-hidden">
          <img
            src={course.imageUrl || 'https://images.pexels.com/photos/1409004/pexels-photo-1409004.jpeg'}
            alt={course.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <Badge variant={match.status === 'open' ? 'default' : 'secondary'}>
              {match.status === 'open' ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : match.status}
            </Badge>
          </div>
        </div>

        <CardHeader>
          <CardTitle className="line-clamp-1">{course.name}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {course.city}, {course.state}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(teeTime, 'MMM d, h:mm a')}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {players.slice(0, 3).map(player => (
                  <Avatar key={player.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={player.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {player.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {players.length > 3 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                    +{players.length - 3}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 font-semibold text-green-600">
              <DollarSign className="h-4 w-4" />
              {centsToDisplay(match.stakesCents)}
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {match.format === 'match_play_net' ? 'Match Play' : 'Stroke Play'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {tee.name} Tees
            </Badge>
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
        </CardContent>
      </Card>
    </Link>
  );
}