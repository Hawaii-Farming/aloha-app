import { z } from 'zod';

type LanguagePriority = 'user' | 'application';

const FeatureFlagsSchema = z.object({
  enableThemeToggle: z.boolean({
    description: 'Enable theme toggle in the user interface.',
    required_error: 'Provide the variable VITE_ENABLE_THEME_TOGGLE',
  }),
  enableTeamDeletion: z.boolean({
    description: 'Enable team deletion.',
    required_error: 'Provide the variable VITE_ENABLE_TEAM_DELETION',
  }),
  enableTeamAccounts: z.boolean({
    description: 'Enable team accounts.',
    required_error: 'Provide the variable VITE_ENABLE_TEAM_ACCOUNTS_DELETION',
  }),
  enableTeamCreation: z.boolean({
    description: 'Enable team creation.',
    required_error: 'Provide the variable VITE_ENABLE_TEAM_ACCOUNTS_CREATION',
  }),
  languagePriority: z
    .enum(['user', 'application'], {
      required_error: 'Provide the variable VITE_LANGUAGE_PRIORITY',
      description: `If set to user, use the user's preferred language. If set to application, use the application's default language.`,
    })
    .default('application'),
});

const featuresFlagConfig = FeatureFlagsSchema.parse({
  enableThemeToggle: getBoolean(import.meta.env.VITE_ENABLE_THEME_TOGGLE, true),
  enableTeamDeletion: getBoolean(
    import.meta.env.VITE_ENABLE_TEAM_ACCOUNTS_DELETION,
    false,
  ),
  enableTeamAccounts: getBoolean(
    import.meta.env.VITE_ENABLE_TEAM_ACCOUNTS,
    true,
  ),
  enableTeamCreation: getBoolean(
    import.meta.env.VITE_ENABLE_TEAM_ACCOUNTS_CREATION,
    true,
  ),
  languagePriority: import.meta.env.VITE_LANGUAGE_PRIORITY as LanguagePriority,
} satisfies z.infer<typeof FeatureFlagsSchema>);

export default featuresFlagConfig;

function getBoolean(value: unknown, defaultValue: boolean) {
  if (typeof value === 'string') {
    return value === 'true';
  }

  return defaultValue;
}
