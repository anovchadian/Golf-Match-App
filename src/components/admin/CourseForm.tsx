import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Course } from '@/lib/types';
import { courseSchema, CourseFormData } from '@/lib/schemas/course';

interface CourseFormProps {
  course: Course | null;
  onSave: (data: Omit<Course, 'id'>) => void;
  onCancel: () => void;
}

export function CourseForm({ course, onSave, onCancel }: CourseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: course || {
      name: '',
      address: '',
      city: '',
      state: '',
      lat: 0,
      lng: 0,
      imageUrl: '',
    },
  });

  function onSubmit(data: CourseFormData) {
    onSave(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Course Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Pebble Beach Golf Links"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="1700 17 Mile Dr"
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="Pebble Beach"
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State (2 letters) *</Label>
          <Input
            id="state"
            {...register('state')}
            placeholder="CA"
            maxLength={2}
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lat">Latitude *</Label>
          <Input
            id="lat"
            type="number"
            step="0.0001"
            {...register('lat', { valueAsNumber: true })}
            placeholder="36.5674"
          />
          {errors.lat && (
            <p className="text-sm text-destructive">{errors.lat.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lng">Longitude *</Label>
          <Input
            id="lng"
            type="number"
            step="0.0001"
            {...register('lng', { valueAsNumber: true })}
            placeholder="-121.9500"
          />
          {errors.lng && (
            <p className="text-sm text-destructive">{errors.lng.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="imageUrl">Image URL (optional)</Label>
          <Input
            id="imageUrl"
            {...register('imageUrl')}
            placeholder="https://images.pexels.com/..."
          />
          {errors.imageUrl && (
            <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Use a high-quality image from Pexels or similar
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
          {isSubmitting ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}