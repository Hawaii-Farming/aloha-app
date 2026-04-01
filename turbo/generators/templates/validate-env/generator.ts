import type { PlopTypes } from '@turbo/gen';

// quick hack to avoid installing zod globally
import { z } from '../../../../apps/web/node_modules/zod';
import { generator } from '../../utils';

const BooleanStringEnum = z.enum(['true', 'false']);

const Schema: Record<string, z.ZodType> = {
  VITE_SITE_URL: z
    .string({
      description: `This is the URL of your website. It should start with https:// like https://example.com.`,
    })
    .url({
      message:
        'VITE_SITE_URL must be a valid URL. Please use HTTPS for production sites, otherwise it will fail.',
    })
    .refine(
      (url) => {
        return url.startsWith('https://');
      },
      {
        message: 'VITE_SITE_URL must start with https://',
        path: ['VITE_SITE_URL'],
      },
    ),
  VITE_PRODUCT_NAME: z
    .string({
      message: 'Product name must be a string',
      description: `This is the name of your product. It should be a short name like Aloha.`,
    })
    .min(1),
  VITE_SITE_DESCRIPTION: z.string({
    message: 'Site description must be a string',
    description: `This is the description of your website. It should be a short sentence or two.`,
  }),
  VITE_DEFAULT_THEME_MODE: z.enum(['light', 'dark', 'system'], {
    message: 'Default theme mode must be light, dark or system',
    description: `This is the default theme mode for your website. It should be light, dark or system.`,
  }),
  VITE_DEFAULT_LOCALE: z.string({
    message: 'Default locale must be a string',
    description: `This is the default locale for your website. It should be a two-letter code like en or fr.`,
  }),
  CONTACT_EMAIL: z
    .string({
      message: 'Contact email must be a valid email',
      description: `This is the email address that will receive contact form submissions.`,
    })
    .email(),
  VITE_ENABLE_THEME_TOGGLE: BooleanStringEnum,
  VITE_AUTH_PASSWORD: BooleanStringEnum,
  VITE_AUTH_MAGIC_LINK: BooleanStringEnum,
  VITE_ENABLE_TEAM_ACCOUNTS: BooleanStringEnum,
  VITE_ENABLE_TEAM_ACCOUNT_DELETION: BooleanStringEnum,
  VITE_ENABLE_TEAM_ACCOUNTS_CREATION: BooleanStringEnum,
  VITE_SUPABASE_URL: z
    .string({
      description: `This is the URL to your hosted Supabase instance.`,
    })
    .url({
      message: 'Supabase URL must be a valid URL',
    }),
  VITE_SUPABASE_ANON_KEY: z.string({
    message: 'Supabase anon key must be a string',
    description: `This is the key provided by Supabase. It is a public key used client-side.`,
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string({
    message: 'Supabase service role key must be a string',
    description: `This is the key provided by Supabase. It is a private key used server-side.`,
  }),
  MAILER_PROVIDER: z.enum(['nodemailer', 'resend'], {
    message: 'Mailer provider must be nodemailer or resend',
    description: `This is the mailer provider you want to use for sending emails. nodemailer is a generic SMTP mailer, resend is a service.`,
  }),
};

export function createEnvironmentVariablesValidatorGenerator(
  plop: PlopTypes.NodePlopAPI,
) {
  return plop.setGenerator('validate-env', {
    description: 'Validate the environment variables to be used in the app',
    actions: [
      async (answers) => {
        if (!('path' in answers) || !answers.path) {
          throw new Error('URL is required');
        }

        const env = generator.loadEnvironmentVariables(answers.path as string);

        for (const key of Object.keys(env)) {
          const property = Schema[key];
          const value = env[key];

          if (property) {
            // parse with Zod
            const { error } = property.safeParse(value);

            if (error) {
              throw new Error(
                `Encountered a validation error for key ${key}:${value} \n\n${JSON.stringify(error, null, 2)}`,
              );
            } else {
              console.log(`Key ${key} is valid!`);
            }
          }
        }

        return 'Environment variables are valid!';
      },
    ],
    prompts: [
      {
        type: 'input',
        name: 'path',
        message:
          'Where is the path to the environment variables file? Leave empty to use the generated turbo/generators/templates/env/.env.local',
        default: 'turbo/generators/templates/env/.env.local',
      },
    ],
  });
}
