'use client';

import { Input } from '../shadcn/input';
import { Label } from '../shadcn/label';
import { Switch } from '../shadcn/switch';
import { Trans } from './trans';

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showInactive: boolean;
  onShowInactiveChange: (value: boolean) => void;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  selectedCount?: number;
}

export function DataTableToolbar(props: DataTableToolbarProps) {
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      data-test="data-table-toolbar"
    >
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={props.searchValue}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder={props.searchPlaceholder}
          className="h-8 w-full sm:w-[250px]"
          data-test="table-search"
        />

        {props.filterSlot}

        <div className="flex items-center gap-1.5">
          <Switch
            checked={props.showInactive}
            onCheckedChange={props.onShowInactiveChange}
            id="show-inactive"
          />

          <Label htmlFor="show-inactive" className="text-xs">
            <Trans i18nKey="common:showInactive" defaults="Show Inactive" />
          </Label>
        </div>
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
