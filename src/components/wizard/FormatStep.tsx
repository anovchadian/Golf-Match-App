import { UseFormReturn } from 'react-hook-form';
import { Trophy, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateMatchFormData } from '@/lib/schemas/createMatch';
import { cn } from '@/lib/utils';

interface FormatStepProps {
  form: UseFormReturn<CreateMatchFormData>;
}

export function FormatStep({ form }: FormatStepProps) {
  const selectedFormat = form.watch('format');
  const skins = form.watch('skins');
  const nassau = form.watch('nassau');
  const maxPlayers = form.watch('maxPlayers');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <Trophy className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Choose Your Game Format</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select the scoring format and optional side games for your match.
            </p>
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-4">
        <Label>Match Format</Label>
        {form.formState.errors.format && (
          <p className="text-sm text-destructive">
            {form.formState.errors.format.message}
          </p>
        )}
        <RadioGroup
          value={selectedFormat}
          onValueChange={(value: 'match_play_net' | 'net_stroke') =>
            form.setValue('format', value)
          }
          className="space-y-3"
        >
          <div
            className={cn(
              'flex items-start space-x-3 rounded-lg border-2 p-4 transition-colors cursor-pointer',
              selectedFormat === 'match_play_net'
                ? 'border-green-600 bg-green-50 dark:bg-green-950'
                : 'border-border hover:border-green-300'
            )}
            onClick={() => form.setValue('format', 'match_play_net')}
          >
            <RadioGroupItem value="match_play_net" id="match_play_net" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="match_play_net" className="cursor-pointer font-semibold">
                Match Play (Net)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Head-to-head competition where you win, lose, or tie each hole. Best for 2 players.
              </p>
            </div>
          </div>

          <div
            className={cn(
              'flex items-start space-x-3 rounded-lg border-2 p-4 transition-colors cursor-pointer',
              selectedFormat === 'net_stroke'
                ? 'border-green-600 bg-green-50 dark:bg-green-950'
                : 'border-border hover:border-green-300'
            )}
            onClick={() => form.setValue('format', 'net_stroke')}
          >
            <RadioGroupItem value="net_stroke" id="net_stroke" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="net_stroke" className="cursor-pointer font-semibold">
                Stroke Play (Net)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Lowest total net score wins. Great for 2-4 players competing for the best round.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Optional Side Games */}
      <div className="space-y-4">
        <Label>Optional Side Games</Label>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
            <Checkbox
              id="skins"
              checked={skins}
              onCheckedChange={(checked) => form.setValue('skins', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="skins" className="cursor-pointer font-semibold">
                Skins
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Win a skin by having the lowest net score on a hole. Ties carry over to the next hole.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
            <Checkbox
              id="nassau"
              checked={nassau}
              onCheckedChange={(checked) => form.setValue('nassau', checked as boolean)}
              disabled={selectedFormat !== 'match_play_net'}
            />
            <div className="flex-1">
              <Label
                htmlFor="nassau"
                className={cn(
                  'cursor-pointer font-semibold',
                  selectedFormat !== 'match_play_net' && 'text-muted-foreground'
                )}
              >
                Nassau
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Three separate bets: front nine, back nine, and overall 18. Only available for Match Play.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Max Players */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="maxPlayers">Maximum Players</Label>
        </div>
        <Select
          value={maxPlayers.toString()}
          onValueChange={(value) => form.setValue('maxPlayers', parseInt(value))}
        >
          <SelectTrigger id="maxPlayers">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Players</SelectItem>
            <SelectItem value="3">3 Players</SelectItem>
            <SelectItem value="4">4 Players</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {selectedFormat === 'match_play_net'
            ? 'Match Play works best with 2 players, but you can include up to 4.'
            : 'Stroke Play supports 2-4 players competing for the lowest score.'}
        </p>
      </div>
    </div>
  );
}