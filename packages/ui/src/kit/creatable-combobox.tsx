'use client';

import { useState } from 'react';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { cn } from '../lib/utils';
import { Button } from '../shadcn/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../shadcn/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../shadcn/form';
import { Popover, PopoverContent, PopoverTrigger } from '../shadcn/popover';

interface CreatableComboboxProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: string[];
  disabled?: boolean;
}

export function CreatableCombobox<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  disabled,
}: CreatableComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const trimmed = search.trim();
  const showCreate =
    trimmed.length > 0 &&
    !options.some((o) => o.toLowerCase() === trimmed.toLowerCase());

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium">{label}</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={cn(
                    'w-full justify-between font-normal',
                    !field.value && 'text-muted-foreground',
                  )}
                >
                  {field.value || (placeholder ?? 'Select or type...')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput
                  placeholder="Search or type new..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty className="py-2 text-center text-sm">
                    No matches
                  </CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option}
                        value={option}
                        onSelect={() => {
                          field.onChange(option);
                          setSearch('');
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            field.value === option
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {option}
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {showCreate && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          value={trimmed}
                          onSelect={() => {
                            field.onChange(trimmed);
                            setSearch('');
                            setOpen(false);
                          }}
                          className="text-primary"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add &ldquo;{trimmed}&rdquo;
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
