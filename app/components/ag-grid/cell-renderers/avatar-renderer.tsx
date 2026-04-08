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
}

/**
 * AG Grid cell renderer that displays an employee avatar.
 * Shows profile photo if available, otherwise shows initials fallback.
 * Designed as a standalone column (no name text — name is in a separate column).
 */
export function AvatarRenderer(props: CustomCellRendererProps) {
  const data = props.data as EmployeeRow | undefined;
  if (!data) return null;

  const { profile_photo_url, first_name, last_name } = data;
  const displayName =
    first_name && last_name
      ? `${first_name} ${last_name}`
      : last_name || first_name || '';
  const initials = getInitials(first_name, last_name);

  return (
    <div className="flex h-full items-center justify-center">
      {profile_photo_url ? (
        <img
          src={profile_photo_url}
          alt={displayName}
          className="h-6 w-6 shrink-0 rounded-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.className =
                'bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold';
              fallback.textContent = initials;
              parent.replaceChild(fallback, target);
            }
          }}
        />
      ) : (
        <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}
