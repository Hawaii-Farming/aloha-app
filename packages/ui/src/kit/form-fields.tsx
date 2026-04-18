'use client';

import { format, formatISO, parse, parseISO } from 'date-fns';
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
import { Label } from '../shadcn/label';
import { Popover, PopoverContent, PopoverTrigger } from '../shadcn/popover';
import { RadioGroup, RadioGroupItem } from '../shadcn/radio-group';
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
  /** When true, renders a red asterisk after the label text. */
  required?: boolean;
}

interface FormSelectFieldProps<
  T extends FieldValues = FieldValues,
> extends FormFieldProps<T> {
  options: Array<{ value: string; label: string }>;
}

/** Renders a red asterisk after the label when required is true.
 *  aria-hidden so screen readers rely on the form's own required attribute. */
function RequiredMark({ required }: { required?: boolean }) {
  if (!required) return null;
  return (
    <span aria-hidden="true" className="text-destructive ml-0.5">
      *
    </span>
  );
}

export function FormTextField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
  required,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium">
            {label}
            <RequiredMark required={required} />
          </FormLabel>
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
  required,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium">
            {label}
            <RequiredMark required={required} />
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              disabled={disabled}
              rows={3}
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
  required,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium">
            {label}
            <RequiredMark required={required} />
          </FormLabel>
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
  required,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium">
            {label}
            <RequiredMark required={required} />
          </FormLabel>
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
                    ? format(
                        parse(field.value, 'yyyy-MM-dd', new Date()),
                        'MM/dd/yyyy',
                      )
                    : (placeholder ?? 'Pick a date')}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  field.value
                    ? parse(field.value, 'yyyy-MM-dd', new Date())
                    : undefined
                }
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

export function FormDateTimeField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
  required,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentDate = field.value ? parseISO(field.value) : undefined;
        const timeValue = currentDate ? format(currentDate, 'HH:mm') : '';
        const dateLabel = currentDate
          ? format(currentDate, 'MM/dd/yyyy')
          : (placeholder ?? 'Pick a date');

        const combine = (date: Date, hhmm: string) => {
          const [h, m] = hhmm ? hhmm.split(':').map((n) => Number(n)) : [0, 0];
          const next = new Date(date);
          next.setHours(h ?? 0, m ?? 0, 0, 0);
          return formatISO(next);
        };

        return (
          <FormItem>
            <FormLabel className="text-xs font-medium">
              {label}
              <RequiredMark required={required} />
            </FormLabel>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'flex-1 justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                      disabled={disabled}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateLabel}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => {
                      if (!date) return field.onChange('');
                      field.onChange(combine(date, timeValue));
                    }}
                    disabled={disabled}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                className="w-32"
                value={timeValue}
                disabled={disabled}
                onChange={(e) => {
                  const nextTime = e.target.value;
                  if (!nextTime) return;
                  const base = currentDate ?? new Date();
                  field.onChange(combine(base, nextTime));
                }}
              />
            </div>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export function FormBooleanField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  required,
}: FormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium">
            {label}
            <RequiredMark required={required} />
          </FormLabel>
          <div className="flex h-9 items-center rounded-md border px-3">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            {description && (
              <FormDescription className="text-xs">
                {description}
              </FormDescription>
            )}
          </div>
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
  required,
  options,
}: FormSelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium">
            {label}
            <RequiredMark required={required} />
          </FormLabel>
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

export function FormRadioField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  required,
  options,
}: FormSelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium">
            {label}
            <RequiredMark required={required} />
          </FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={disabled}
              className="flex gap-4 pt-1"
            >
              {options.map((option) => (
                <div key={option.value} className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value={option.value}
                    id={`${String(name)}-${option.value}`}
                  />
                  <Label
                    htmlFor={`${String(name)}-${option.value}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
