'use client';

import { Trans } from './trans';

interface DataTableToolbarProps {
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  selectedCount?: number;
}

export function DataTableToolbar(props: DataTableToolbarProps) {
  return (
    <div
      className="flex flex-nowrap items-center gap-2 sm:flex-wrap"
      data-test="data-table-toolbar"
    >
      <div className="ml-auto flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
        {props.filterSlot}
      </div>

      <div className="flex items-center gap-2">
        {props.selectedCount && props.selectedCount > 0 ? (
          <span className="text-muted-foreground text-sm">
            <Trans
              i18nKey="common:rowsSelected"
              values={{ count: props.selectedCount }}
            />
          </span>
        ) : null}

        {props.actionSlot}
      </div>
    </div>
  );
}
