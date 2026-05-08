const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'origin' | 'webp' | 'jpeg' | 'png';
}

export function resolveStoragePublicUrl(
  path: string | null | undefined,
  transform?: TransformOptions,
): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!SUPABASE_URL) return null;
  const encoded = path
    .replace(/^\/+/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  const segment = transform
    ? 'storage/v1/render/image/public'
    : 'storage/v1/object/public';
  const base = `${SUPABASE_URL}/${segment}/${encoded}`;
  if (!transform) return base;
  const qs = new URLSearchParams();
  if (transform.width) qs.set('width', String(transform.width));
  if (transform.height) qs.set('height', String(transform.height));
  if (transform.quality) qs.set('quality', String(transform.quality));
  if (transform.resize) qs.set('resize', transform.resize);
  if (transform.format) qs.set('format', transform.format);
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}
