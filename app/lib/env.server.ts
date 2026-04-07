import { z } from 'zod';

const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // Supabase (at least one anon/public key required)
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    VITE_SUPABASE_PUBLIC_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),

    // AI (optional)
    ANTHROPIC_API_KEY: z.string().min(1).optional(),

    // Webhooks (optional)
    SUPABASE_DB_WEBHOOK_SECRET: z.string().min(1).optional(),

    // Email (optional)
    EMAIL_SENDER: z.string().min(1).optional(),
    EMAIL_HOST: z.string().min(1).optional(),
    EMAIL_PORT: z.coerce.number().optional(),
    EMAIL_USER: z.string().min(1).optional(),
    EMAIL_PASSWORD: z.string().min(1).optional(),
  })
  .refine(
    (d) => d.VITE_SUPABASE_ANON_KEY || d.VITE_SUPABASE_PUBLIC_KEY,
    'Either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLIC_KEY must be set',
  );

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _env: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (_env && process.env.NODE_ENV === 'production') return _env;

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten();

    console.error(
      'Invalid server environment variables:',
      formatted.fieldErrors,
      formatted.formErrors,
    );
    throw new Error('Invalid server environment variables');
  }

  _env = result.data;
  return _env;
}
