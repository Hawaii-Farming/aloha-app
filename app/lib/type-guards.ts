/**
 * Type guard for narrowing unknown errors to objects with a `code` property.
 * Shared across client and server code.
 */
export function isErrorWithCode(
  error: unknown,
): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}
