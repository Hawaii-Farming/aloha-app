import { cn } from '../lib/utils';
import { Badge } from '../shadcn/badge';
import { Trans } from './trans';

type WorkflowColor =
  | 'default'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'secondary';

const colorClassMap: Record<WorkflowColor, string> = {
  default: '',
  success:
    'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  destructive: '',
  secondary: '',
};

const colorVariantMap: Record<
  WorkflowColor,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  default: 'default',
  success: 'outline',
  warning: 'outline',
  destructive: 'destructive',
  secondary: 'secondary',
};

const dotColorMap: Record<WorkflowColor, string> = {
  default: 'bg-stone-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-red-500',
  secondary: 'bg-stone-400',
};

interface StatusConfig {
  label: string;
  color: WorkflowColor;
}

interface WorkflowStatusBadgeProps {
  status: string;
  states: Record<string, StatusConfig>;
}

export function WorkflowStatusBadge({
  status,
  states,
}: WorkflowStatusBadgeProps) {
  const config = states[status];

  if (!config) {
    return null;
  }

  return (
    <>
      {/* Mobile: just the colored dot (with aria/title for context) */}
      <span
        className={cn(
          'inline-block h-2.5 w-2.5 shrink-0 rounded-full sm:hidden',
          dotColorMap[config.color],
        )}
        aria-label={config.label}
        title={config.label}
        data-test={`status-badge-${status}`}
      />
      {/* sm+: full text pill */}
      <Badge
        variant={colorVariantMap[config.color]}
        className={cn('hidden sm:inline-flex', colorClassMap[config.color])}
        data-test={`status-badge-${status}-text`}
      >
        <Trans i18nKey={config.label} defaults={config.label} />
      </Badge>
    </>
  );
}
