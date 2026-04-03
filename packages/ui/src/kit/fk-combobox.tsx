'use client';

import { useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';
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
} from '../shadcn/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../shadcn/form';
import { Popover, PopoverContent, PopoverTrigger } from '../shadcn/popover';
import { Trans } from './trans';

interface FkComboboxProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export function FkCombobox<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  disabled,
}: FkComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  data-test="fk-combobox"
                  disabled={disabled}
                  className={cn(
                    'w-full justify-between',
                    !field.value && 'text-muted-foreground',
                  )}
                >
                  {field.value
                    ? options.find((o) => o.value === field.value)?.label
                    : (placeholder ?? 'Select...')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder={placeholder} />
                <CommandList>
                  <CommandEmpty>
                    <Trans
                      i18nKey="common:noResults"
                      defaults="No results found."
                    />
                  </CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          field.onChange(option.value);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            field.value === option.value
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
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
