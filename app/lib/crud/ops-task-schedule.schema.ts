import { z } from 'zod';

export const opsTaskScheduleSchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  ops_task_id: z.string().min(1, 'Task is required'),
  start_time: z.string().min(1, 'Date is required'),
  stop_time: z.string().optional(),
});
