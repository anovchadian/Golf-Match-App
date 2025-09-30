import { z } from 'zod';

export const createMatchSchema = z.object({
  // Step 1: Course & Tee
  courseId: z.string().min(1, 'Please select a course'),
  teeId: z.string().min(1, 'Please select a tee set'),

  // Step 2: Tee Time
  teeTimeDate: z.string().min(1, 'Please select a date'),
  teeTimeHour: z.string().min(1, 'Please select an hour'),
  teeTimeMinute: z.string().min(1, 'Please select minutes'),
  teeTimePeriod: z.enum(['AM', 'PM']),

  // Step 3: Format & Options
  format: z.enum(['match_play_net', 'net_stroke'], {
    required_error: 'Please select a format',
  }),
  skins: z.boolean().default(false),
  nassau: z.boolean().default(false),
  maxPlayers: z.number().min(2).max(4).default(2),

  // Step 4: Stakes
  stakesDollars: z.number().min(1, 'Stakes must be at least $1').max(10000, 'Stakes cannot exceed $10,000'),
});

export type CreateMatchFormData = z.infer<typeof createMatchSchema>;