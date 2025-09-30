import { UseFormReturn } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreateMatchFormData } from '@/lib/schemas/createMatch';
import { Course, Tee } from '@/lib/types';
import { mockDb } from '@/lib/store/mockDb';
import { cn } from '@/lib/utils';

interface CourseStepProps {
  form: UseFormReturn<CreateMatchFormData>;
}

export function CourseStep({ form }: CourseStepProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tees, setTees] = useState<Tee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCourseId = form.watch('courseId');
  const selectedTeeId = form.watch('teeId');

  useEffect(() => {
    setCourses(mockDb.getCourses());
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      setTees(mockDb.getTees(selectedCourseId));
      // Reset tee selection when course changes
      if (form.getValues('teeId')) {
        const currentTee = mockDb.getTee(form.getValues('teeId'));
        if (currentTee?.courseId !== selectedCourseId) {
          form.setValue('teeId', '');
        }
      }
    } else {
      setTees([]);
    }
  }, [selectedCourseId, form]);

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="course-search">Search Courses</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="course-search"
              placeholder="Search by name, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label>Select Course</Label>
          {form.formState.errors.courseId && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.courseId.message}
            </p>
          )}
          <RadioGroup
            value={selectedCourseId}
            onValueChange={(value) => form.setValue('courseId', value)}
            className="mt-2 space-y-3"
          >
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className={cn(
                  'flex items-start space-x-3 rounded-lg border-2 p-4 transition-colors cursor-pointer',
                  selectedCourseId === course.id
                    ? 'border-green-600 bg-green-50 dark:bg-green-950'
                    : 'border-border hover:border-green-300'
                )}
                onClick={() => form.setValue('courseId', course.id)}
              >
                <RadioGroupItem value={course.id} id={course.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <Label htmlFor={course.id} className="cursor-pointer font-semibold">
                        {course.name}
                      </Label>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {course.city}, {course.state}
                      </div>
                    </div>
                    {course.imageUrl && (
                      <img
                        src={course.imageUrl}
                        alt={course.name}
                        className="h-16 w-24 rounded object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Tee Selection */}
      {selectedCourseId && tees.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label>Select Tee Set</Label>
            {form.formState.errors.teeId && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.teeId.message}
              </p>
            )}
          </div>
          <RadioGroup
            value={selectedTeeId}
            onValueChange={(value) => form.setValue('teeId', value)}
            className="space-y-3"
          >
            {tees.map((tee) => (
              <div
                key={tee.id}
                className={cn(
                  'flex items-start space-x-3 rounded-lg border-2 p-4 transition-colors cursor-pointer',
                  selectedTeeId === tee.id
                    ? 'border-green-600 bg-green-50 dark:bg-green-950'
                    : 'border-border hover:border-green-300'
                )}
                onClick={() => form.setValue('teeId', tee.id)}
              >
                <RadioGroupItem value={tee.id} id={tee.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={tee.id} className="cursor-pointer font-semibold">
                    {tee.name} ({tee.color})
                  </Label>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Rating:</span>{' '}
                      <span className="font-medium">{tee.rating}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Slope:</span>{' '}
                      <span className="font-medium">{tee.slope}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Par:</span>{' '}
                      <span className="font-medium">{tee.par}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Yardage:</span>{' '}
                      <span className="font-medium">{tee.yardage}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
    </div>
  );
}