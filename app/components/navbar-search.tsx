import { type ReactNode, useEffect, useState } from 'react';

import { useNavigate } from 'react-router';

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

export interface NavbarSearchItem {
  /** Unique path used as the navigate() target and the React key. */
  path: string;
  /** Visible label rendered inside CommandItem. */
  label: string;
  /** Optional group heading to bucket the item under (e.g. "Modules"). */
  group?: string;
}

interface NavbarSearchProps {
  renderTrigger?: (props: { open: () => void; isMac: boolean }) => ReactNode;
  items?: NavbarSearchItem[];
}

export function NavbarSearch({
  renderTrigger,
  items = [],
}: NavbarSearchProps = {}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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

  // Bucket items by optional `group`; items without a group fall under 'Suggestions'.
  const grouped = new Map<string, NavbarSearchItem[]>();
  for (const item of items) {
    const key = item.group ?? 'Suggestions';
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }

  const handleSelect = (path: string) => {
    // Navigate FIRST, then close the dialog — closing before navigate can
    // abort focus-dependent navigation flows in some cmdk versions.
    navigate(path);
    setOpen(false);
  };

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
          {Array.from(grouped.entries()).map(([heading, groupItems]) => (
            <CommandGroup key={heading} heading={heading}>
              {groupItems.map((item) => (
                <CommandItem
                  key={item.path}
                  value={`${item.label} ${item.path}`}
                  keywords={[item.label, item.group ?? ''].filter(Boolean)}
                  onSelect={() => handleSelect(item.path)}
                  data-test={`navbar-search-item-${item.path}`}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
