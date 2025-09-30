import { Link } from 'react-router-dom';
import { Menu, User, Wallet, History, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '@/lib/api/users.client';
import { Profile } from '@/lib/types';

export function Header() {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
              <span className="text-lg font-bold text-white">⛳</span>
            </div>
            <span className="text-xl font-bold">GolfMatch</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Discover
            </Link>
            <Link
              to="/create"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Create Match
            </Link>
            <Link
              to="/history"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              History
            </Link>
            <Link
              to="/statistics"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Statistics
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback>
                      {user.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.ghinConnected && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-600 border-2 border-background flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">✓</span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.displayName}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        HI: {user.handicapIndex}
                      </p>
                      {user.ghinConnected && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                          GHIN
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wallet" className="cursor-pointer">
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/history" className="cursor-pointer">
                    <History className="mr-2 h-4 w-4" />
                    Match History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/statistics" className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Statistics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer text-muted-foreground">
                    Admin (Demo)
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}