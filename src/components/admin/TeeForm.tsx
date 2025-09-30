import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course, Tee } from '@/lib/types';
import { teeSchema, TeeFormData } from '@/lib/schemas/course';
import { Info } from 'lucide-react';

interface TeeFormProps {
  tee: Tee | null;
  courses: Course[];
  onSave: (data: Omit<Tee, 'id'>) => void;
  onCancel: () => void;
}

export function TeeForm({ tee, courses, onSave, onCancel }: TeeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TeeFormData>({
    resolver: zodResolver(teeSchema),
    defaultValues: tee || {
      courseId: '',
      name: '',
      color: '',
      slope: 113,
      rating: 72.0,
      par: 72,
      yardage: 6500,
      strokeIndex: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    },
  });

  const selectedCourseId = watch('courseId');

  function onSubmit(data: TeeFormData) {
    onSave(data);
  }

  function generateStrokeIndex() {
    const indices = Array.from({ length: 18 }, (_, i) => i + 1);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setValue('strokeIndex', indices);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="courseId">Course *</Label>
          <Select
            value={selectedCourseId}
            onValueChange={(value) => setValue('courseId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.courseId && (
            <p className="text-sm text-destructive">{errors.courseId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Tee Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Championship"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color *</Label>
          <Input
            id="color"
            {...register('color')}
            placeholder="Blue"
          />
          {errors.color && (
            <p className="text-sm text-destructive">{errors.color.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slope">Slope Rating * (55-155)</Label>
          <Input
            id="slope"
            type="number"
            {...register('slope', { valueAsNumber: true })}
            placeholder="113"
          />
          {errors.slope && (
            <p className="text-sm text-destructive">{errors.slope.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Average slope is 113
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating">Course Rating * (60-85)</Label>
          <Input
            id="rating"
            type="number"
            step="0.1"
            {...register('rating', { valueAsNumber: true })}
            placeholder="72.0"
          />
          {errors.rating && (
            <p className="text-sm text-destructive">{errors.rating.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Relative to par for scratch golfer
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="par">Par * (60-80)</Label>
          <Input
            id="par"
            type="number"
            {...register('par', { valueAsNumber: true })}
            placeholder="72"
          />
          {errors.par && (
            <p className="text-sm text-destructive">{errors.par.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="yardage">Yardage * (3000-8000)</Label>
          <Input
            id="yardage"
            type="number"
            {...register('yardage', { valueAsNumber: true })}
            placeholder="6500"
          />
          {errors.yardage && (
            <p className="text-sm text-destructive">{errors.yardage.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="strokeIndex">Stroke Index * (18 unique values 1-18)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateStrokeIndex}
            >
              Generate Random
            </Button>
          </div>
          <Input
            id="strokeIndex"
            {...register('strokeIndex', {
              setValueAs: (v) => {
                if (typeof v === 'string') {
                  return v.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                }
                return v;
              }
            })}
            placeholder="1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18"
          />
          {errors.strokeIndex && (
            <p className="text-sm text-destructive">{errors.strokeIndex.message}</p>
          )}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-900 dark:text-blue-100">
                Stroke index determines which holes receive handicap strokes. 
                Enter 18 comma-separated numbers (1-18) in order of difficulty, 
                where 1 is the hardest hole. Example: 7,3,13,1,15,9,5,17,11,4,14,2,16,8,12,6,18,10
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
          {isSubmitting ? 'Saving...' : tee ? 'Update Tee Set' : 'Create Tee Set'}
        </Button>
      </div>
    </form>
  );
}