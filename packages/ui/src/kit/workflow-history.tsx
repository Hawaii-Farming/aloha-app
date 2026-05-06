import { Trans } from './trans';

type WorkflowEntryColor =
  | 'default'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'secondary';

interface WorkflowHistoryEntry {
  action: string;
  at: string | null;
  by: string | null;
  color?: WorkflowEntryColor;
}

interface WorkflowHistoryProps {
  entries: WorkflowHistoryEntry[];
}

const dotColorClass: Record<WorkflowEntryColor, string> = {
  default: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-red-500',
  secondary: 'bg-muted-foreground',
};

export function WorkflowHistory({ entries }: WorkflowHistoryProps) {
  const validEntries = entries.filter(
    (entry): entry is WorkflowHistoryEntry & { at: string } =>
      entry.at !== null,
  );

  if (validEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-test="workflow-history">
      {validEntries.map((entry, index) => (
        <div key={index} className="flex gap-3">
          <div
            className={`${dotColorClass[entry.color ?? 'default']} mt-1.5 h-2 w-2 shrink-0 rounded-full`}
          />
          <div>
            <p className="text-sm font-medium">
              <Trans i18nKey={entry.action} defaults={entry.action} />
            </p>
            <p className="text-muted-foreground text-xs">
              {new Date(entry.at).toLocaleString()}
            </p>
            {entry.by && (
              <p className="text-muted-foreground text-xs">{entry.by}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
