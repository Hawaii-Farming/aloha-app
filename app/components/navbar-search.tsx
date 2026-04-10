import { type ReactNode, useEffect, useState } from 'react';

import { Search } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@aloha/ui/command';
import { Kbd } from '@aloha/ui/kbd';

interface NavbarSearchProps {
  renderTrigger?: (props: { open: () => void; isMac: boolean }) => ReactNode;
}

export function NavbarSearch({ renderTrigger }: NavbarSearchProps = {}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().includes('MAC');

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ open: () => setOpen(true), isMac })
      ) : (
        <button
          data-test="navbar-search-trigger"
          onClick={() => setOpen(true)}
          className="border-border bg-muted/50 text-muted-foreground hover:bg-muted flex h-7 w-56 items-center gap-2 rounded-md border px-2 text-xs transition-colors"
          aria-label="Open search"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
        </button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Dashboard</CommandItem>
            <CommandItem>Settings</CommandItem>
            <CommandItem>Modules</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
