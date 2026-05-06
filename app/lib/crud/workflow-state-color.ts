import type { WorkflowColor } from '~/lib/crud/types';

/** Tailwind background-color class for the colored dot used in workflow
 *  history timelines, status asides, and any other state-driven dot UI.
 *  Keep in sync with WorkflowStateConfig['color'] semantics. */
export const STATE_DOT_CLASS: Record<WorkflowColor, string> = {
  default: 'bg-stone-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-red-500',
  secondary: 'bg-stone-400',
};

export function stateDotClass(color: WorkflowColor | undefined): string {
  return STATE_DOT_CLASS[color ?? 'default'];
}
