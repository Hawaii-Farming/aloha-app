import { useEffect, useState } from 'react';

import { useParams } from 'react-router';

import { format, parseISO } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@aloha/ui/avatar';

import { resolveStoragePublicUrl } from '~/lib/supabase/storage-url';

type RowData = Record<string, unknown>;

interface TenantData {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  department_name: string;
  start_date: string | null;
  work_authorization_name: string;
}

interface HousingDetailRowProps {
  data: RowData;
}

export function HousingDetailRow({ data }: HousingDetailRowProps) {
  const { account } = useParams();
  const siteId = String(data.id ?? '');
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);

  const canFetch = !!(siteId && account);

  // Justified: fetch tenant data on mount when detail row expands
  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    const params = new URLSearchParams({ siteId, orgId: account! });
    fetch(`/api/housing-tenants?${params.toString()}`)
      .then((res) => res.json())
      .then((json: { data?: TenantData[] }) => {
        if (!cancelled) {
          setTenants(json.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canFetch, siteId, account]);

  if (loading) {
    return (
      <div className="text-muted-foreground px-6 py-4 text-sm">
        Loading tenants...
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-muted-foreground px-6 py-4 text-sm">
        No tenants assigned to this housing site.
      </div>
    );
  }

  const formatDate = (d: string | null): string => {
    if (!d) return '';
    try {
      return format(parseISO(d), 'MM/dd/yy');
    } catch {
      return d;
    }
  };

  return (
    <div className="px-6 py-4">
      <h4 className="mb-3 text-sm font-semibold">Tenants ({tenants.length})</h4>
      <div className="grid gap-2">
        {tenants.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-md border px-3 py-2"
          >
            <Avatar className="h-8 w-8">
              {t.profile_photo_url && (
                <AvatarImage
                  src={
                    resolveStoragePublicUrl(t.profile_photo_url, {
                      width: 64,
                      height: 64,
                      resize: 'cover',
                      quality: 70,
                      format: 'webp',
                    }) ?? ''
                  }
                />
              )}
              <AvatarFallback className="text-xs">
                {t.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium">{t.full_name}</span>
              {t.department_name && (
                <span className="text-muted-foreground ml-2 text-xs">
                  {t.department_name}
                </span>
              )}
            </div>
            <div className="text-muted-foreground text-xs whitespace-nowrap">
              {t.start_date && formatDate(t.start_date)}
            </div>
            <div className="text-muted-foreground text-xs whitespace-nowrap">
              {t.work_authorization_name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HousingDetailRow;
