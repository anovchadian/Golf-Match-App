import { UseFormReturn } from 'react-hook-form';
import { Calendar, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateMatchFormData } from '@/lib/schemas/createMatch';
import { addDays, format } from 'date-fns';

interface TeeTimeStepProps {
  form: UseFormReturn<CreateMatchFormData>;
}

export function TeeTimeStep({ form }: TeeTimeStepProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 90), 'yyyy-MM-dd');

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Choose Your Tee Time</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select the date and time when you want to play this match. You can schedule up to 90 days in advance.
            </p>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <Label htmlFor="teeTimeDate">Date</Label>
        <Input
          id="teeTimeDate"
          type="date"
          min={today}
          max={maxDate}
          {...form.register('teeTimeDate')}
          className="w-full"
        />
        {form.formState.errors.teeTimeDate && (
          <p className="text-sm text-destructive">
            {form.formState.errors.teeTimeDate.message}
          </p>
        )}
      </div>

      {/* Time Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label>Time</Label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="teeTimeHour" className="text-sm text-muted-foreground">
              Hour
            </Label>
            <Select
              value={form.watch('teeTimeHour')}
              onValueChange={(value) => form.setValue('teeTimeHour', value)}
            >
              <SelectTrigger id="teeTimeHour">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.teeTimeHour && (
              <p className="text-sm text-destructive">
                {form.formState.errors.teeTimeHour.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teeTimeMinute" className="text-sm text-muted-foreground">
              Minute
            </Label>
            <Select
              value={form.watch('teeTimeMinute')}
              onValueChange={(value) => form.setValue('teeTimeMinute', value)}
            >
              <SelectTrigger id="teeTimeMinute">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.teeTimeMinute && (
              <p className="text-sm text-destructive">
                {form.formState.errors.teeTimeMinute.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teeTimePeriod" className="text-sm text-muted-foreground">
              Period
            </Label>
            <Select
              value={form.watch('teeTimePeriod')}
              onValueChange={(value: 'AM' | 'PM') => form.setValue('teeTimePeriod', value)}
            >
              <SelectTrigger id="teeTimePeriod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Preview */}
      {form.watch('teeTimeDate') && form.watch('teeTimeHour') && form.watch('teeTimeMinute') && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            Selected Tee Time
          </p>
          <p className="text-lg font-semibold text-green-700 dark:text-green-300 mt-1">
            {format(new Date(form.watch('teeTimeDate')), 'EEEE, MMMM d, yyyy')} at{' '}
            {form.watch('teeTimeHour')}:{form.watch('teeTimeMinute')} {form.watch('teeTimePeriod')}
          </p>
        </div>
      )}
    </div>
  );
}