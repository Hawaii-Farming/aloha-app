import { z } from 'zod';

export const opsTaskScheduleSchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  ops_task_id: z.string().min(1, 'Task is required'),
  start_time: z.string().min(1, 'Date is required'),
  stop_time: z.string().optional(),
});

export const opsTaskScheduleEntrySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Start time is required'),
    stop_time: z.string().regex(/^\d{2}:\d{2}$/, 'End time is required'),
    ops_task_id: z.string().min(1, 'Task is required'),
  })
  .refine((v) => v.start_time < v.stop_time, {
    message: 'End time must be after start time',
    path: ['stop_time'],
  });

export const opsTaskScheduleWeeklySchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  entries: z.array(opsTaskScheduleEntrySchema).min(1, 'Add at least one day'),
});

export type OpsTaskScheduleEntry = z.infer<typeof opsTaskScheduleEntrySchema>;
export type OpsTaskScheduleWeekly = z.infer<typeof opsTaskScheduleWeeklySchema>;
