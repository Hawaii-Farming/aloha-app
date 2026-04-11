'use client';

import { useState } from 'react';

import { Search, X } from 'lucide-react';

import { Dialog, DialogContent } from '../shadcn/dialog';
import { Input } from '../shadcn/input';
import { Trans } from './trans';

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  selectedCount?: number;
}

export function DataTableToolbar(props: DataTableToolbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-test="data-table-toolbar"
    >
      {/* Mobile: circular search button that opens a full-screen dialog */}
      <button
        type="button"
        onClick={() => setMobileSearchOpen(true)}
        aria-label="Open search"
        className="text-muted-foreground hover:bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:hidden"
        data-test="table-search-toggle"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Desktop inline input */}
      <Input
        value={props.searchValue}
        onChange={(e) => props.onSearchChange(e.target.value)}
        placeholder={props.searchPlaceholder}
        className="placeholder:text-muted-foreground/50 hidden h-8 min-w-0 flex-1 rounded-md text-xs focus:outline-none focus-visible:ring-0 focus-visible:outline-none sm:flex sm:max-w-[250px]"
        data-test="table-search"
      />

      {/* Mobile search modal — autofocus triggers the OS keyboard */}
      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent className="top-0 left-0 h-svh w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-0 sm:hidden">
          <div className="flex items-center gap-2 border-b p-3">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
              className="text-muted-foreground hover:bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
            <Input
              autoFocus
              value={props.searchValue}
              onChange={(e) => props.onSearchChange(e.target.value)}
              placeholder={props.searchPlaceholder}
              className="placeholder:text-muted-foreground/50 h-10 flex-1 rounded-md border-0 text-base focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
              data-test="table-search-mobile"
            />
          </div>
        </DialogContent>
      </Dialog>

      {props.filterSlot}

      <div className="ml-auto flex items-center gap-2">
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
