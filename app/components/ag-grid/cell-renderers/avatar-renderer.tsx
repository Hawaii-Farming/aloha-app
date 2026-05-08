import { useEffect, useState } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import { resolveStoragePublicUrl } from '~/lib/supabase/storage-url';

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

const blobUrlCache = new Map<string, string>();
const inFlightCache = new Map<string, Promise<string | null>>();

function fetchAsBlobUrl(src: string): Promise<string | null> {
  const cached = blobUrlCache.get(src);
  if (cached) return Promise.resolve(cached);
  const inFlight = inFlightCache.get(src);
  if (inFlight) return inFlight;
  const p = fetch(src)
    .then(async (r) => {
      if (!r.ok) return null;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      blobUrlCache.set(src, url);
      return url;
    })
    .catch(() => null)
    .finally(() => inFlightCache.delete(src));
  inFlightCache.set(src, p);
  return p;
}

const BOX_STYLE = {
  width: 36,
  height: 36,
  minWidth: 36,
  minHeight: 36,
  maxWidth: 36,
  maxHeight: 36,
} as const;

export function AvatarRenderer(props: CustomCellRendererProps) {
  const data = props.data as EmployeeRow | undefined;

  const photoSrc = resolveStoragePublicUrl(data?.profile_photo_url, {
    width: 72,
    height: 72,
    resize: 'cover',
    quality: 70,
    format: 'webp',
  });

  const [, setTick] = useState(0);

  useEffect(() => {
    if (!photoSrc || blobUrlCache.has(photoSrc)) return;
    let cancelled = false;
    fetchAsBlobUrl(photoSrc).then((url) => {
      if (!cancelled && url) setTick((t) => t + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [photoSrc]);

  const blobUrl = photoSrc ? (blobUrlCache.get(photoSrc) ?? null) : null;

  if (!data) return null;

  const { first_name, last_name, full_name } = data;
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
      <div style={BOX_STYLE} className="relative shrink-0">
        <div
          style={BOX_STYLE}
          className="bg-primary/10 text-primary absolute inset-0 flex items-center justify-center rounded-full text-sm font-semibold"
        >
          {initials}
        </div>
        {blobUrl && (
          <img
            src={blobUrl}
            alt={displayName}
            decoding="async"
            style={BOX_STYLE}
            className="animate-in fade-in absolute inset-0 block rounded-full object-cover duration-150"
          />
        )}
      </div>
    </div>
  );
}
