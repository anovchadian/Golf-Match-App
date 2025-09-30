import { UseFormReturn } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { MapPin, Calendar, Trophy, DollarSign, Users, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateMatchFormData } from '@/lib/schemas/createMatch';
import { Course, Tee } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { centsToDisplay } from '@/lib/money';
import { format } from 'date-fns';

interface ReviewStepProps {
  form: UseFormReturn<CreateMatchFormData>;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [tee, setTee] = useState<Tee | null>(null);

  const formData = form.watch();

  useEffect(() => {
    if (formData.courseId) {
      setCourse(mockDb.getCourse(formData.courseId) || null);
    }
    if (formData.teeId) {
      setTee(mockDb.getTee(formData.teeId) || null);
    }
  }, [formData.courseId, formData.teeId]);

  const getTeeTimeString = () => {
    if (!formData.teeTimeDate || !formData.teeTimeHour || !formData.teeTimeMinute) {
      return 'Not set';
    }
    const date = new Date(formData.teeTimeDate);
    return `${format(date, 'EEEE, MMMM d, yyyy')} at ${formData.teeTimeHour}:${formData.teeTimeMinute} ${formData.teeTimePeriod}`;
  };

  const getFormatString = () => {
    return formData.format === 'match_play_net' ? 'Match Play (Net)' : 'Stroke Play (Net)';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="font-medium">Review Your Match Details</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please review all details before creating your match. You can go back to edit any section.
        </p>
      </div>

      {/* Course & Tee */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Course & Tee
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              // This would be handled by the parent component's step navigation
              const event = new CustomEvent('editStep', { detail: 1 });
              window.dispatchEvent(event);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        {course && tee ? (
          <div className="space-y-2">
            <p className="font-medium">{course.name}</p>
            <p className="text-sm text-muted-foreground">
              {course.city}, {course.state}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{tee.name} Tees</Badge>
              <Badge variant="outline">{tee.color}</Badge>
              <Badge variant="outline">Rating: {tee.rating}</Badge>
              <Badge variant="outline">Slope: {tee.slope}</Badge>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not selected</p>
        )}
      </div>

      {/* Tee Time */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Tee Time
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const event = new CustomEvent('editStep', { detail: 2 });
              window.dispatchEvent(event);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm">{getTeeTimeString()}</p>
      </div>

      {/* Format */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            Format & Options
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const event = new CustomEvent('editStep', { detail: 3 });
              window.dispatchEvent(event);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{getFormatString()}</p>
          <div className="flex gap-2">
            {formData.skins && <Badge variant="outline">Skins</Badge>}
            {formData.nassau && <Badge variant="outline">Nassau</Badge>}
            <Badge variant="outline">{formData.maxPlayers} Players Max</Badge>
          </div>
        </div>
      </div>

      {/* Stakes */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Stakes
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const event = new CustomEvent('editStep', { detail: 4 });
              window.dispatchEvent(event);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-2xl font-bold text-green-600">
          {centsToDisplay(formData.stakesDollars * 100)}
        </p>
        <p className="text-sm text-muted-foreground">per player</p>
      </div>

      {/* Summary */}
      <div className="rounded-lg border-2 border-green-600 bg-green-50 dark:bg-green-950 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-900 dark:text-green-100">
            Match Summary
          </h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700 dark:text-green-300">Total Pot</span>
            <span className="font-semibold text-green-900 dark:text-green-100">
              {centsToDisplay(formData.stakesDollars * formData.maxPlayers * 100)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700 dark:text-green-300">Your Entry</span>
            <span className="font-semibold text-green-900 dark:text-green-100">
              {centsToDisplay(formData.stakesDollars * 100)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700 dark:text-green-300">Open Spots</span>
            <span className="font-semibold text-green-900 dark:text-green-100">
              {formData.maxPlayers - 1} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}