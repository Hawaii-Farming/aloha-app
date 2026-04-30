import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router';

import { Filter, Search, X } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@aloha/ui/command';
import { useIsMobile } from '@aloha/ui/hooks/use-mobile';
import { Kbd } from '@aloha/ui/kbd';
import { Popover, PopoverAnchor, PopoverContent } from '@aloha/ui/popover';

import { useActiveTableSearch } from '~/components/active-table-search-context';

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
  /**
   * Restrict this instance to a viewport. When set, the Cmd+K listener and
   * the Popover only engage when the current viewport matches. Required when
   * both desktop and mobile headers mount their own NavbarSearch — otherwise
   * Cmd+K opens both popovers and the hidden trigger anchors to origin.
   */
  variant?: 'desktop' | 'mobile';
}

const GROUP_ORDER = ['Modules', 'Pages', 'Suggestions'] as const;

export function NavbarSearch({
  renderTrigger,
  items = [],
  variant,
}: NavbarSearchProps = {}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { activeTable, setQuery, clearQuery } = useActiveTableSearch();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // An instance is "active" only when its declared variant matches the
  // current viewport. With no variant (legacy callers), always active.
  const active =
    variant === undefined || (variant === 'mobile' ? isMobile : !isMobile);

  useEffect(() => {
    if (!active) return;
    let slashArmedAt = 0;
    const SEQUENCE_WINDOW_MS = 800;
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      );
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === '/') {
        slashArmedAt = Date.now();
        return;
      }
      if (
        e.key === 'k' &&
        slashArmedAt > 0 &&
        Date.now() - slashArmedAt <= SEQUENCE_WINDOW_MS
      ) {
        e.preventDefault();
        slashArmedAt = 0;
        setOpen((prev) => !prev);
        return;
      }
      slashArmedAt = 0;
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  const handleOpenChange = (next: boolean) => {
    // Reset the controlled input on open so the palette starts empty each time.
    if (next) setInput('');
    setOpen(next);
  };

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
    // Navigate FIRST, then close the popover — closing before navigate can
    // abort focus-dependent navigation flows in some cmdk versions.
    navigate(path);
    setOpen(false);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Live-filter the active AG Grid table on every keystroke. Guard on
    // activeTable so non-list routes don't leak a stale query to a sibling page.
    if (activeTable) {
      setQuery(value.trim());
    }
  };

  const handleClear = () => {
    setInput('');
    clearQuery();
    // Refocus so the user can keep typing immediately after clearing.
    inputRef.current?.focus();
  };

  const handleCommandKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // First Esc on a non-empty input: clear input + active-table filter.
    // Second Esc (empty input) falls through to Radix and closes the popover.
    if (e.key === 'Escape' && input.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      handleClear();
    }
  };

  // Force-close when the viewport no longer matches this variant (prevents
  // a stale popover lingering after resize across the md breakpoint).
  return (
    <Popover open={active && open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        {renderTrigger ? (
          renderTrigger({ open: () => setOpen(true), isMac })
        ) : (
          <button
            type="button"
            data-test="navbar-search-trigger"
            onClick={() => setOpen(true)}
            className="border-border bg-muted/50 text-muted-foreground hover:bg-muted flex h-7 w-56 items-center gap-2 rounded-md border px-2 text-xs transition-colors"
            aria-label="Open search"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <Kbd>/ K</Kbd>
          </button>
        )}
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        data-test="navbar-search-popover"
      >
        <Command shouldFilter={!activeTable} onKeyDown={handleCommandKeyDown}>
          <div className="border-border flex items-center border-b [&>[cmdk-input-wrapper]]:flex-1 [&>[cmdk-input-wrapper]]:border-b-0">
            <CommandInput
              ref={inputRef}
              placeholder="Type a command or search..."
              value={input}
              onValueChange={handleInputChange}
            />
            {input.length > 0 && (
              <button
                type="button"
                data-test="navbar-search-clear"
                onClick={handleClear}
                aria-label="Clear search"
                className="text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <CommandList className="max-h-[360px]">
            <CommandEmpty>No results found.</CommandEmpty>

            {activeTable && input.trim().length > 0 && (
              <>
                <div
                  data-test="navbar-search-active-filter-hint"
                  className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs"
                >
                  <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Filtering{' '}
                    <span className="text-foreground font-medium">
                      {activeTable.displayName}
                    </span>{' '}
                    rows live
                  </span>
                </div>
                <CommandSeparator />
              </>
            )}

            {renderGroups(grouped, handleSelect)}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function renderGroups(
  grouped: Map<string, NavbarSearchItem[]>,
  handleSelect: (path: string) => void,
) {
  // Deterministic order: Modules → Pages → Suggestions → any others (alphabetical).
  const knownOrdered = GROUP_ORDER.filter((g) => grouped.has(g));
  const extras = Array.from(grouped.keys())
    .filter(
      (g): g is string =>
        !GROUP_ORDER.includes(g as (typeof GROUP_ORDER)[number]),
    )
    .sort();
  const ordered = [...knownOrdered, ...extras];

  // Track visibility so we only draw separators between groups that actually render.
  let visibleCount = 0;

  return ordered.map((heading) => {
    const groupItems = grouped.get(heading);
    if (!groupItems || groupItems.length === 0) return null;
    const showSeparator = visibleCount > 0;
    visibleCount += 1;
    return (
      <FragmentWithSeparator key={heading} showSeparator={showSeparator}>
        <CommandGroup heading={heading}>
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
      </FragmentWithSeparator>
    );
  });
}

function FragmentWithSeparator({
  children,
  showSeparator,
}: {
  children: ReactNode;
  showSeparator: boolean;
}) {
  return (
    <>
      {showSeparator && <CommandSeparator />}
      {children}
    </>
  );
}
