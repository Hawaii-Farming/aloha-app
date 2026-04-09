import { z } from 'zod';

/** Treat empty strings as undefined so `VAR=` in .env works with `.optional()` */
const optionalEnv = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().min(1).optional(),
);

const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // Supabase (at least one anon/public key required)
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: optionalEnv,
    VITE_SUPABASE_PUBLIC_KEY: optionalEnv,
    SUPABASE_SERVICE_ROLE_KEY: optionalEnv,
    SUPABASE_SECRET_KEY: optionalEnv,

    // AI (optional)
    ANTHROPIC_API_KEY: optionalEnv,

    // Webhooks (optional)
    SUPABASE_DB_WEBHOOK_SECRET: optionalEnv,

    // Email (optional)
    EMAIL_SENDER: optionalEnv,
    EMAIL_HOST: optionalEnv,
    EMAIL_PORT: z.coerce.number().optional(),
    EMAIL_USER: optionalEnv,
    EMAIL_PASSWORD: optionalEnv,
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
