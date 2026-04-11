'use client';

import { useState } from 'react';

import { Search } from 'lucide-react';

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

  const closeMobileSearch = () => setMobileSearchOpen(false);

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-test="data-table-toolbar"
    >
      {/* Backdrop dims the rest of the screen while search is open on mobile.
       * Clicking it closes the search (filter stays applied). */}
      {mobileSearchOpen && (
        <div
          onClick={closeMobileSearch}
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile: circular button (closed) OR inline input (open, raised above backdrop) */}
      {mobileSearchOpen ? (
        <Input
          autoFocus
          value={props.searchValue}
          onChange={(e) => props.onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
              closeMobileSearch();
            }
          }}
          onBlur={closeMobileSearch}
          placeholder={props.searchPlaceholder}
          className="placeholder:text-muted-foreground/50 relative z-40 h-9 w-full basis-full rounded-full text-sm focus:outline-none focus-visible:ring-0 focus-visible:outline-none sm:hidden"
          data-test="table-search-mobile"
        />
      ) : (
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

      {/* Desktop inline input */}
      <Input
        value={props.searchValue}
        onChange={(e) => props.onSearchChange(e.target.value)}
        placeholder={props.searchPlaceholder}
        className="placeholder:text-muted-foreground/50 hidden h-8 min-w-0 flex-1 rounded-md text-xs focus:outline-none focus-visible:ring-0 focus-visible:outline-none sm:flex sm:max-w-[250px]"
        data-test="table-search"
      />

      {/* Hide filter + action slots while mobile search is open so the
       * input gets the full toolbar width. */}
      <div
        className={
          mobileSearchOpen
            ? 'hidden flex-wrap items-center gap-2 sm:flex'
            : 'flex flex-wrap items-center gap-2'
        }
      >
        {props.filterSlot}
      </div>

      <div
        className={
          mobileSearchOpen
            ? 'ml-auto hidden items-center gap-2 sm:flex'
            : 'ml-auto flex items-center gap-2'
        }
      >
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
