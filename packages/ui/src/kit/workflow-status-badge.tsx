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
    <Badge
      variant={colorVariantMap[config.color]}
      className={cn(colorClassMap[config.color])}
      data-test={`status-badge-${status}`}
    >
      <Trans i18nKey={config.label} defaults={config.label} />
    </Badge>
  );
}
