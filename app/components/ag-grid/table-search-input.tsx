'use client';

import { useState } from 'react';

import { Search } from 'lucide-react';

interface TableSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'data-test'?: string;
}

/**
 * Desktop: inline text input (text-xs, h-8).
 * Mobile: circular Search icon button; tapping reveals an inline full-width
 * input with a dim backdrop over the rest of the screen. Filter persists on
 * close (Enter/Escape/blur/backdrop-tap).
 */
export function TableSearchInput({
  value,
  onChange,
  placeholder,
  'data-test': dataTest,
}: TableSearchInputProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      {mobileOpen && (
        <div
          onClick={close}
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          aria-hidden="true"
        />
      )}

      {mobileOpen ? (
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
              close();
            }
          }}
          onBlur={close}
          placeholder={placeholder}
          className="border-input bg-background placeholder:text-muted-foreground/50 relative z-40 h-9 w-full basis-full rounded-full border px-4 text-sm focus:outline-none focus-visible:ring-0 focus-visible:outline-none sm:hidden"
          data-test={dataTest ? `${dataTest}-mobile` : undefined}
        />
      ) : (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open search"
          className="text-muted-foreground hover:bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:hidden"
          data-test={dataTest ? `${dataTest}-toggle` : undefined}
        >
          <Search className="h-4 w-4" />
        </button>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-input bg-background placeholder:text-muted-foreground/50 hidden h-8 w-[200px] rounded-md border px-3 text-xs focus:outline-none focus-visible:ring-0 focus-visible:outline-none sm:flex"
        data-test={dataTest}
      />
    </>
  );
}
