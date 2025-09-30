import { UseFormReturn } from 'react-hook-form';
import { DollarSign, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreateMatchFormData } from '@/lib/schemas/createMatch';
import { centsToDisplay } from '@/lib/money';

interface StakesStepProps {
  form: UseFormReturn<CreateMatchFormData>;
}

export function StakesStep({ form }: StakesStepProps) {
  const stakesDollars = form.watch('stakesDollars');
  const skins = form.watch('skins');
  const nassau = form.watch('nassau');
  const format = form.watch('format');

  const calculateBreakdown = () => {
    if (!stakesDollars) return null;

    const total = stakesDollars;
    let breakdown: { label: string; amount: number }[] = [];

    if (format === 'match_play_net') {
      if (nassau) {
        const perBet = Math.floor(total / 3);
        breakdown = [
          { label: 'Front Nine', amount: perBet },
          { label: 'Back Nine', amount: perBet },
          { label: 'Overall 18', amount: perBet },
        ];
      } else {
        breakdown = [{ label: 'Match Play', amount: total }];
      }
    } else {
      breakdown = [{ label: 'Stroke Play', amount: total }];
    }

    if (skins) {
      breakdown.push({ label: 'Skins Pool', amount: total });
    }

    return breakdown;
  };

  const breakdown = calculateBreakdown();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Set Your Stakes</p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose the amount each player will contribute to the match pot.
            </p>
          </div>
        </div>
      </div>

      {/* Stakes Input */}
      <div className="space-y-2">
        <Label htmlFor="stakesDollars">Stakes per Player</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="stakesDollars"
            type="number"
            min="1"
            max="10000"
            step="1"
            {...form.register('stakesDollars', { valueAsNumber: true })}
            className="pl-10"
            placeholder="50"
          />
        </div>
        {form.formState.errors.stakesDollars && (
          <p className="text-sm text-destructive">
            {form.formState.errors.stakesDollars.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Minimum: $1 • Maximum: $10,000
        </p>
      </div>

      {/* Quick Amounts */}
      <div className="space-y-2">
        <Label>Quick Select</Label>
        <div className="grid grid-cols-4 gap-2">
          {[10, 25, 50, 100].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => form.setValue('stakesDollars', amount)}
              className={`rounded-lg border-2 p-3 text-center font-semibold transition-colors ${
                stakesDollars === amount
                  ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'border-border hover:border-green-300'
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Stakes Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
          <p className="font-medium">Stakes Breakdown</p>
          <div className="space-y-2">
            {breakdown.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{centsToDisplay(item.amount * 100)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total per Player</span>
              <span className="text-green-600">
                {centsToDisplay(stakesDollars * 100)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warning for High Stakes */}
      {stakesDollars >= 500 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900 dark:text-orange-100">
                High Stakes Match
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                This is a high-stakes match. Make sure all players are comfortable with the amount before proceeding.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}