# Aloha Form Components Reference

## Import Pattern

```typescript
import { useFetcher } from 'react-router';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@aloha/ui/form';
import { Input } from '@aloha/ui/input';
import { Button } from '@aloha/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@aloha/ui/select';
import { Textarea } from '@aloha/ui/textarea';
import { Checkbox } from '@aloha/ui/checkbox';
import { Switch } from '@aloha/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@aloha/ui/alert';
import { If } from '@aloha/ui/if';
import { Trans } from '@aloha/ui/trans';
import { toast } from '@aloha/ui/sonner';
```

## Form Field Pattern

```tsx
<FormField
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        <Trans i18nKey="namespace:fieldLabel" />
      </FormLabel>
      <FormControl>
        <Input
          data-test="field-name-input"
          placeholder="Enter value"
          {...field}
        />
      </FormControl>
      <FormDescription>
        <Trans i18nKey="namespace:fieldDescription" />
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Select Field

```tsx
<FormField
  name="category"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Category</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger data-test="category-select">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Checkbox Field

```tsx
<FormField
  name="acceptTerms"
  render={({ field }) => (
    <FormItem className="flex items-center space-x-2">
      <FormControl>
        <Checkbox
          data-test="accept-terms-checkbox"
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <FormLabel className="!mt-0">
        <Trans i18nKey="namespace:acceptTerms" />
      </FormLabel>
    </FormItem>
  )}
/>
```

## Switch Field

```tsx
<FormField
  name="notifications"
  render={({ field }) => (
    <FormItem className="flex items-center justify-between">
      <div>
        <FormLabel>Enable Notifications</FormLabel>
        <FormDescription>Receive email notifications</FormDescription>
      </div>
      <FormControl>
        <Switch
          data-test="notifications-switch"
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

## Textarea Field

```tsx
<FormField
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea
          data-test="description-textarea"
          placeholder="Enter description..."
          rows={4}
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Error Alert

```tsx
<Alert variant="destructive">
  <AlertTitle>
    <Trans i18nKey="common.errors.title" />
  </AlertTitle>
  <AlertDescription>
    <Trans i18nKey="common.errors.generic" />
  </AlertDescription>
</Alert>
```

## Submit Button

```tsx
<Button
  type="submit"
  disabled={isSubmitting}
  data-test="submit-button"
>
  <Trans i18nKey={isSubmitting ? 'common.submitting' : 'common.submit'} />
</Button>
```

## Complete Form Template (with useFetcher)

```tsx
import { useCallback } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFetcher } from 'react-router';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@aloha/ui/alert';
import { Button } from '@aloha/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@aloha/ui/form';
import { Input } from '@aloha/ui/input';
import { Trans } from '@aloha/ui/trans';
import { toast } from '@aloha/ui/sonner';

import { MySchema } from '../_lib/schemas/my.schema';

export function MyForm() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';

  const form = useForm({
    resolver: zodResolver(MySchema),
    defaultValues: { name: '' },
  });

  const onSubmit = useCallback(
    (data: { name: string }) => {
      fetcher.submit(data, {
        method: 'POST',
        encType: 'application/json',
      });
    },
    [fetcher],
  );

  if (fetcher.data?.success) {
    return (
      <Alert variant="success">
        <AlertTitle>
          <Trans i18nKey="common.success" />
        </AlertTitle>
      </Alert>
    );
  }

  if (fetcher.data?.error) {
    toast.error('An error occurred');
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="namespace:name" />
              </FormLabel>
              <FormControl>
                <Input data-test="name-input" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} data-test="submit-button">
          <Trans i18nKey={isSubmitting ? 'common.submitting' : 'common.submit'} />
        </Button>
      </form>
    </Form>
  );
}
```

## Complete Form Template (with fetcher.Form)

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useFetcher } from 'react-router';
import { useForm } from 'react-hook-form';

import { Button } from '@aloha/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@aloha/ui/form';
import { Input } from '@aloha/ui/input';
import { Trans } from '@aloha/ui/trans';

import { MySchema } from '../_lib/schemas/my.schema';

export function MyForm() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';

  const form = useForm({
    resolver: zodResolver(MySchema),
    defaultValues: { name: '' },
  });

  return (
    <Form {...form}>
      <fetcher.Form method="post" className="space-y-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="namespace:name" />
              </FormLabel>
              <FormControl>
                <Input data-test="name-input" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} data-test="submit-button">
          <Trans i18nKey={isSubmitting ? 'common.submitting' : 'common.submit'} />
        </Button>
      </fetcher.Form>
    </Form>
  );
}
```
