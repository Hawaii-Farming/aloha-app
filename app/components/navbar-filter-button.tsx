import { useEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import { SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@aloha/ui/button';
import { Label } from '@aloha/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@aloha/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterFieldDef {
  /** Stable key (used for form testId, allValueLabel prefix, etc.). */
  key: string;
  /** Human-readable label shown above the select. */
  label: string;
  /** Select options, excluding the "all" sentinel (that's added automatically). */
  options: FilterOption[];
  /** Current value. Empty string = no filter applied. */
  value: string;
  /** Setter. Called with the selected value, or an empty string when "all" is chosen. */
  onChange: (value: string) => void;
  /** Optional placeholder text (defaults to "All <label>s"). */
  allLabel?: string;
}

interface NavbarFilterButtonProps {
  filters: FilterFieldDef[];
  /** data-test prefix for the trigger button and its panel. */
  testKey?: string;
}

// Resolve the navbar slot once on mount. The slot is rendered by
// WorkspaceNavbar and is stable for the lifetime of the shell.
function useNavbarFilterSlot(): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot portal target lookup on mount
    setEl(document.getElementById('workspace-navbar-filter-slot'));
  }, []);
  return el;
}

export function NavbarFilterButton({
  filters,
  testKey = 'navbar-filter',
}: NavbarFilterButtonProps) {
  const slot = useNavbarFilterSlot();

  const activeFilters = filters.filter((f) => f.value !== '');
  const activeCount = activeFilters.length;

  // Short summary of active filter values shown next to the "Filters" label.
  // Uses the option label (falls back to raw value). Truncated if too many.
  const activeSummary = activeFilters
    .map((f) => {
      const opt = f.options.find((o) => o.value === f.value);
      return opt?.label ?? f.value;
    })
    .join(' · ');

  const clearAll = () => {
    for (const f of filters) {
      if (f.value !== '') f.onChange('');
    }
  };

  if (!slot) return null;

  return createPortal(
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-test={`${testKey}-button`}
          aria-label="Filters"
          className="h-10 max-w-[520px] gap-2 rounded-full px-4 text-sm font-medium"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <span className="shrink-0">Filters</span>
          {activeCount > 0 && (
            <span
              className="text-muted-foreground min-w-0 truncate font-normal"
              data-test={`${testKey}-active-summary`}
            >
              {activeSummary}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-0"
        data-test={`${testKey}-panel`}
      >
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Filters</span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
              data-test={`${testKey}-clear-all`}
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          {filters.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground text-sm">{f.label}</Label>
              <Select
                value={f.value || 'all'}
                onValueChange={(v) => f.onChange(v === 'all' ? '' : v)}
              >
                <SelectTrigger
                  className="h-9 w-full text-sm"
                  data-test={`${testKey}-${f.key}`}
                >
                  <SelectValue placeholder={f.allLabel ?? `All ${f.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {f.allLabel ?? `All ${f.label}`}
                  </SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>,
    slot,
  );
}
