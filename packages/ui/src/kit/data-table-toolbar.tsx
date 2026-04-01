'use client';

import { Input } from '../shadcn/input';
import { Label } from '../shadcn/label';
import { Switch } from '../shadcn/switch';
import { Trans } from './trans';

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  selectedCount?: number;
}

export function DataTableToolbar(props: DataTableToolbarProps) {
  return (
    <div
      className="flex items-center justify-between gap-2"
      data-test="data-table-toolbar"
    >
      <div className="flex flex-1 items-center gap-2">
        <Input
          value={props.searchValue}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder={props.searchPlaceholder}
          className="h-8 w-[250px]"
          data-test="table-search"
        />

        {props.filterSlot}

        <div className="flex items-center gap-1.5">
          <Switch
            checked={props.showDeleted}
            onCheckedChange={props.onShowDeletedChange}
            id="show-deleted"
          />

          <Label htmlFor="show-deleted" className="text-xs">
            <Trans i18nKey="common:showDeleted" />
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
