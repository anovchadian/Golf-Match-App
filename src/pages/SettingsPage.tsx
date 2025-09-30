import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Lock, CreditCard, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GHINConnection } from '@/components/settings/GHINConnection';
import { fetchCurrentUser, updateProfile } from '@/lib/api/users.client';
import { Profile } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

export function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    setLoading(true);
    try {
      const currentUser = await fetchCurrentUser();
      if (!currentUser) {
        navigate('/');
        return;
      }
      setUser(currentUser);
      setDisplayName(currentUser.displayName);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!user || !displayName) return;

    setSaving(true);
    try {
      await updateProfile(user.id, {
        displayName,
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });

      await loadUser();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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

  if (!user) {
    return (
      <div className="container py-8">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold">Settings Not Available</h3>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Back to Discover
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <User className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {user.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handicap-index">Handicap Index</Label>
                <Input
                  id="handicap-index"
                  value={user.handicapIndex}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {user.ghinConnected
                    ? 'Synced from GHIN - cannot be manually edited'
                    : 'Connect GHIN below to sync your official handicap'}
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving || displayName === user.displayName}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GHIN Integration */}
        <GHINConnection user={user} onUpdate={loadUser} />

        {/* Notifications (Placeholder) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Bell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings coming soon
            </p>
          </CardContent>
        </Card>

        {/* Security (Placeholder) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Security settings coming soon
            </p>
          </CardContent>
        </Card>

        {/* Payment Methods (Placeholder) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage your payment methods and billing information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Payment settings coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}