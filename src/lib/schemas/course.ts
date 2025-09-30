import { z } from 'zod';

export const courseSchema = z.object({
  name: z.string().min(3, 'Course name must be at least 3 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().length(2, 'State must be 2 characters (e.g., CA)'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const teeSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  name: z.string().min(2, 'Tee name must be at least 2 characters'),
  color: z.string().min(2, 'Color must be at least 2 characters'),
  slope: z.number().min(55, 'Slope must be at least 55').max(155, 'Slope cannot exceed 155'),
  rating: z.number().min(60, 'Rating must be at least 60').max(85, 'Rating cannot exceed 85'),
  par: z.number().min(60, 'Par must be at least 60').max(80, 'Par cannot exceed 80'),
  yardage: z.number().min(3000, 'Yardage must be at least 3000').max(8000, 'Yardage cannot exceed 8000'),
  strokeIndex: z.array(z.number().min(1).max(18))
    .length(18, 'Stroke index must have exactly 18 values')
    .refine(
      (arr) => {
        const unique = new Set(arr);
        return unique.size === 18 && arr.every(n => n >= 1 && n <= 18);
      },
      'Stroke index must contain unique values from 1 to 18'
    ),
});

export type CourseFormData = z.infer<typeof courseSchema>;
export type TeeFormData = z.infer<typeof teeSchema>;