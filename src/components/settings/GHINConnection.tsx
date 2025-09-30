import { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Profile } from '@/lib/types';
import { verifyGHINCredentials, disconnectGHIN, getGHINInstructions } from '@/lib/api/ghin.client';
import { updateProfile } from '@/lib/api/users.client';
import { useToast } from '@/components/ui/use-toast';
import { mockDb } from '@/lib/store/mockDb';
import { cn } from '@/lib/utils';

interface GHINConnectionProps {
  user: Profile;
  onUpdate: () => void;
}

export function GHINConnection({ user, onUpdate }: GHINConnectionProps) {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [ghinNumber, setGhinNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  async function handleConnect() {
    if (!ghinNumber || !lastName) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both your GHIN number and last name.',
        variant: 'destructive',
      });
      return;
    }

    setConnecting(true);
    try {
      const result = await verifyGHINCredentials({
        ghinNumber,
        lastName,
      });

      if (!result.success || !result.profile) {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Unable to verify GHIN credentials.',
          variant: 'destructive',
        });
        return;
      }

      // Update user profile with GHIN data
      await updateProfile(user.id, {
        ghinConnected: true,
        ghinId: result.profile.ghinNumber,
        ghinLastSync: new Date().toISOString(),
        handicapIndex: result.profile.handicapIndex,
        hiSource: 'ghin',
        verified: true,
      });

      // Add handicap history entry
      mockDb.addHandicapEntry(user.id, {
        date: new Date().toISOString(),
        handicapIndex: result.profile.handicapIndex,
        source: 'ghin',
      });

      toast({
        title: 'GHIN Connected!',
        description: `Your official handicap index (${result.profile.handicapIndex}) has been synced from GHIN.`,
      });

      setGhinNumber('');
      setLastName('');
      onUpdate();
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect to GHIN',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectGHIN(user.id);

      await updateProfile(user.id, {
        ghinConnected: false,
        ghinId: undefined,
        ghinLastSync: undefined,
        hiSource: 'self',
        verified: false,
      });

      toast({
        title: 'GHIN Disconnected',
        description: 'Your GHIN account has been disconnected. You can reconnect anytime.',
      });

      onUpdate();
    } catch (error) {
      toast({
        title: 'Disconnection Error',
        description: error instanceof Error ? error.message : 'Failed to disconnect GHIN',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                GHIN Integration
                {user.ghinConnected && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Sync your official handicap from the Golf Handicap and Information Network
              </CardDescription>
            </div>
          </div>
          <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>GHIN Connection Instructions</DialogTitle>
                <DialogDescription>
                  How to find and connect your GHIN account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="whitespace-pre-line text-sm">
                  {getGHINInstructions()}
                </div>
                <a
                  href="https://www.ghin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Visit GHIN Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {user.ghinConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-green-600 bg-green-50 dark:bg-green-950 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    GHIN Account Connected
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your official handicap index is automatically synced from GHIN
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">GHIN Number:</span>
                      <span className="font-semibold text-green-900 dark:text-green-100">
                        {user.ghinId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Current Index:</span>
                      <span className="font-semibold text-green-900 dark:text-green-100">
                        {user.handicapIndex}
                      </span>
                    </div>
                    {user.ghinLastSync && (
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-300">Last Synced:</span>
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          {new Date(user.ghinLastSync).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect GHIN'
                )}
              </Button>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                ℹ️ About GHIN Sync
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your handicap is automatically updated when you sync. GHIN data is considered official and verified.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Connect Your GHIN Account</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get your official handicap index automatically synced and verified
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ghin-number">GHIN Number</Label>
                <Input
                  id="ghin-number"
                  type="text"
                  placeholder="1234567"
                  value={ghinNumber}
                  onChange={(e) => setGhinNumber(e.target.value)}
                  maxLength={7}
                />
                <p className="text-xs text-muted-foreground">
                  Your 7-digit GHIN number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  As it appears in GHIN
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={connecting || !ghinNumber || !lastName}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Connect GHIN Account
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 p-4">
              <p className="text-sm text-orange-900 dark:text-orange-100 font-medium">
                🔒 Privacy & Security
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                We only access your handicap index and basic profile information. Your GHIN credentials are securely stored and never shared.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}