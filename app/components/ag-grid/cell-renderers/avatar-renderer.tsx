import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * Generates uppercase initials from first and last name.
 * Exported for unit testing.
 */
export function getInitials(
  firstName: string | undefined | null,
  lastName: string | undefined | null,
): string {
  const first = firstName?.charAt(0)?.toUpperCase() ?? '';
  const last = lastName?.charAt(0)?.toUpperCase() ?? '';
  return `${first}${last}`;
}

interface EmployeeRow {
  profile_photo_url?: string | null;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

/**
 * AG Grid cell renderer that displays an employee avatar.
 * Shows profile photo if available, otherwise shows initials fallback.
 * Supports both first_name/last_name (Register) and full_name (Scheduler) fields.
 */
export function AvatarRenderer(props: CustomCellRendererProps) {
  const data = props.data as EmployeeRow | undefined;
  if (!data) return null;

  const { profile_photo_url, first_name, last_name, full_name } = data;
  const displayName =
    first_name && last_name
      ? `${first_name} ${last_name}`
      : full_name || last_name || first_name || '';
  const initials =
    first_name || last_name
      ? getInitials(first_name, last_name)
      : getInitials(
          full_name?.split(' ')[0],
          full_name?.split(' ').slice(1).pop(),
        );

  return (
    <div className="flex h-full items-center justify-center">
      {profile_photo_url ? (
        <img
          src={profile_photo_url}
          alt={displayName}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.className =
                'bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold';
              fallback.textContent = initials;
              parent.replaceChild(fallback, target);
            }
          }}
        />
      ) : (
        <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}
