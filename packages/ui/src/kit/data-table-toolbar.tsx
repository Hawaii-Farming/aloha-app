'use client';

import { useEffect, useRef, useState } from 'react';

import { Search, X } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen) inputRef.current?.focus();
  }, [mobileSearchOpen]);

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-test="data-table-toolbar"
    >
      {/* Mobile: circular search button when collapsed */}
      {!mobileSearchOpen && (
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Open search"
          className="text-muted-foreground hover:bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:hidden"
          data-test="table-search-toggle"
        >
          <Search className="h-4 w-4" />
        </button>
      )}

      {/* Search input: always visible on sm+, toggled on mobile */}
      <div
        className={
          mobileSearchOpen
            ? 'flex min-w-0 flex-1 items-center gap-1'
            : 'hidden min-w-0 flex-1 sm:flex'
        }
      >
        <Input
          ref={inputRef}
          value={props.searchValue}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder={props.searchPlaceholder}
          className="placeholder:text-muted-foreground/50 h-8 min-w-0 flex-1 rounded-md text-xs focus:outline-none focus-visible:ring-0 focus-visible:outline-none sm:max-w-[250px]"
          data-test="table-search"
        />
        {mobileSearchOpen && (
          <button
            type="button"
            onClick={() => {
              props.onSearchChange('');
              setMobileSearchOpen(false);
            }}
            aria-label="Close search"
            className="text-muted-foreground hover:bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

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
