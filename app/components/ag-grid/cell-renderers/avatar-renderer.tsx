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
 * AG Grid cell renderer that displays an employee avatar with name.
 * Shows profile photo if available, otherwise shows initials fallback.
 * Name is displayed as "Last, First" format beside the avatar.
 */
export function AvatarRenderer(props: CustomCellRendererProps) {
  const data = props.data as EmployeeRow | undefined;
  if (!data) return null;

  const { profile_photo_url, first_name, last_name } = data;
  const displayName =
    first_name && last_name
      ? `${last_name}, ${first_name}`
      : last_name || first_name || '';
  const initials = getInitials(first_name, last_name);

  return (
    <div className="flex items-center gap-2">
      {profile_photo_url ? (
        <img
          src={profile_photo_url}
          alt={displayName}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium">
          {initials}
        </div>
      )}
      <span>{displayName}</span>
    </div>
  );
}
