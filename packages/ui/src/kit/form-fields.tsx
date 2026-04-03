'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { cn } from '../lib/utils';
import { Button } from '../shadcn/button';
import { Calendar } from '../shadcn/calendar';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../shadcn/form';
import { Input } from '../shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from '../shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn/select';
import { Switch } from '../shadcn/switch';
import { Textarea } from '../shadcn/textarea';

interface FormFieldProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
}

interface FormSelectFieldProps<
  T extends FieldValues = FieldValues,
> extends FormFieldProps<T> {
  options: Array<{ value: string; label: string }>;
}

export function FormTextField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder={placeholder}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormTextareaField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormNumberField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={placeholder}
              disabled={disabled}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormDateField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground',
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value
                    ? format(new Date(field.value), 'PPP')
                    : (placeholder ?? 'Pick a date')}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) =>
                  field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                }
                disabled={disabled}
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormBooleanField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormSelectField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
  options,
}: FormSelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
