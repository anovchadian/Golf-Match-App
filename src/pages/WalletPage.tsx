import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, Plus, Minus, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCurrentUser } from '@/lib/api/users.client';
import { fetchWallet, createEscrow, processPayout } from '@/lib/api/wallet.client';
import { Profile, Wallet, WalletTransaction } from '@/lib/types';
import { centsToDisplay, dollarsToCents } from '@/lib/money';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { mockDb } from '@/lib/store/mockDb';

export function WalletPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadWalletData();
  }, []);

  async function loadWalletData() {
    setLoading(true);
    try {
      const currentUser = await fetchCurrentUser();
      if (!currentUser) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view your wallet.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setUser(currentUser);

      const walletData = await fetchWallet(currentUser.id);
      if (!walletData) {
        // Create wallet if it doesn't exist
        const newWallet = mockDb.updateWallet(currentUser.id, {
          userId: currentUser.id,
          balanceCents: 0,
          transactions: [],
        });
        setWallet(newWallet || null);
      } else {
        setWallet(walletData);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!user || !depositAmount) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 1 || amount > 10000) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter an amount between $1 and $10,000.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const transaction = mockDb.addTransaction(user.id, {
        userId: user.id,
        type: 'deposit',
        amountCents: dollarsToCents(amount),
        status: 'completed',
      });

      toast({
        title: 'Deposit Successful',
        description: `${centsToDisplay(dollarsToCents(amount))} has been added to your wallet.`,
      });

      setDepositAmount('');
      setDepositOpen(false);
      await loadWalletData();
    } catch (error) {
      toast({
        title: 'Deposit Failed',
        description: error instanceof Error ? error.message : 'Failed to process deposit',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleWithdraw() {
    if (!user || !wallet || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 1) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    const amountCents = dollarsToCents(amount);
    if (amountCents > wallet.balanceCents) {
      toast({
        title: 'Insufficient Funds',
        description: 'You do not have enough balance for this withdrawal.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const transaction = mockDb.addTransaction(user.id, {
        userId: user.id,
        type: 'withdrawal',
        amountCents: -amountCents,
        status: 'completed',
      });

      toast({
        title: 'Withdrawal Successful',
        description: `${centsToDisplay(amountCents)} has been withdrawn from your wallet.`,
      });

      setWithdrawAmount('');
      setWithdrawOpen(false);
      await loadWalletData();
    } catch (error) {
      toast({
        title: 'Withdrawal Failed',
        description: error instanceof Error ? error.message : 'Failed to process withdrawal',
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
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user || !wallet) {
    return (
      <div className="container py-8">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Wallet Not Available</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Unable to load wallet information.
          </p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Back to Discover
          </Button>
        </Card>
      </div>
    );
  }

  const filteredTransactions = filterType === 'all'
    ? wallet.transactions
    : wallet.transactions.filter(t => t.type === filterType);

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
        <p className="text-muted-foreground">
          Manage your balance and view transaction history
        </p>
      </div>

      {/* Balance Card */}
      <Card className="mb-6 overflow-hidden border-2 border-green-600">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 mb-2">Available Balance</p>
              <p className="text-5xl font-bold">
                {centsToDisplay(wallet.balanceCents)}
              </p>
            </div>
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
              <WalletIcon className="h-10 w-10" />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-white text-green-700 hover:bg-green-50">
                  <Plus className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                  <DialogDescription>
                    Add money to your wallet to join matches
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="deposit-amount"
                        type="number"
                        min="1"
                        max="10000"
                        step="1"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="pl-10"
                        placeholder="100"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Minimum: $1 • Maximum: $10,000
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 100, 250].map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        onClick={() => setDepositAmount(amount.toString())}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDepositOpen(false)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeposit}
                    disabled={processing || !depositAmount}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? 'Processing...' : 'Deposit'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  variant="outline"
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Transfer money from your wallet to your bank account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border border-border bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-green-600">
                      {centsToDisplay(wallet.balanceCents)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="withdraw-amount"
                        type="number"
                        min="1"
                        max={wallet.balanceCents / 100}
                        step="1"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="pl-10"
                        placeholder="50"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Maximum: {centsToDisplay(wallet.balanceCents)}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setWithdrawOpen(false)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleWithdraw}
                    disabled={processing || !withdrawAmount}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? 'Processing...' : 'Withdraw'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="escrow">Escrow</SelectItem>
                  <SelectItem value="payout">Payouts</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <WalletIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Deposit funds to start playing matches
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTransactions.map((transaction) => {
                const isPositive = transaction.amountCents > 0;
                const typeConfig = getTransactionTypeConfig(transaction.type);

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center',
                          typeConfig.bgColor
                        )}
                      >
                        {typeConfig.icon}
                      </div>
                      <div>
                        <p className="font-semibold">{typeConfig.label}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                        {transaction.matchId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Match ID: {transaction.matchId.substring(0, 8)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          'text-xl font-bold',
                          isPositive ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {centsToDisplay(transaction.amountCents)}
                      </p>
                      <Badge
                        variant={transaction.status === 'completed' ? 'default' : 'outline'}
                        className="mt-1"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getTransactionTypeConfig(type: WalletTransaction['type']) {
  switch (type) {
    case 'deposit':
      return {
        label: 'Deposit',
        icon: <Plus className="h-5 w-5 text-green-600" />,
        bgColor: 'bg-green-100 dark:bg-green-900',
      };
    case 'withdrawal':
      return {
        label: 'Withdrawal',
        icon: <Minus className="h-5 w-5 text-red-600" />,
        bgColor: 'bg-red-100 dark:bg-red-900',
      };
    case 'escrow':
      return {
        label: 'Match Entry (Escrow)',
        icon: <WalletIcon className="h-5 w-5 text-orange-600" />,
        bgColor: 'bg-orange-100 dark:bg-orange-900',
      };
    case 'payout':
      return {
        label: 'Match Winnings',
        icon: <TrendingUp className="h-5 w-5 text-green-600" />,
        bgColor: 'bg-green-100 dark:bg-green-900',
      };
    case 'refund':
      return {
        label: 'Refund',
        icon: <TrendingDown className="h-5 w-5 text-blue-600" />,
        bgColor: 'bg-blue-100 dark:bg-blue-900',
      };
    default:
      return {
        label: 'Transaction',
        icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
        bgColor: 'bg-muted',
      };
  }
}