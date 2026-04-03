import { Fragment } from 'react';

import { Link, useLocation } from 'react-router';

import { OrgSelector } from '~/components/sidebar/org-selector';

const unslugify = (slug: string) =>
  slug
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

interface NavbarBreadcrumbsProps {
  accounts?: Array<{
    label: string | null;
    value: string | null;
    image: string | null;
  }>;
  userId?: string;
  selectedAccount?: string;
}

export function NavbarBreadcrumbs(props: NavbarBreadcrumbsProps) {
  const pathname = useLocation().pathname;
  const segments = pathname.split('/').filter(Boolean);

  // Skip "home" prefix — start from the account segment
  const displaySegments = segments.slice(1);

  if (displaySegments.length === 0) {
    return null;
  }

  const hasMultipleOrgs =
    props.accounts && props.accounts.length > 1 && props.userId && props.selectedAccount;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      {displaySegments.map((segment, index) => {
        const isFirst = index === 0;
        const isLast = index === displaySegments.length - 1;
        const href = '/' + segments.slice(0, index + 2).join('/');
        const label = unslugify(segment);

        return (
          <Fragment key={index}>
            {index > 0 && (
              <span className="text-muted-foreground mx-1.5">/</span>
            )}
            {isFirst && hasMultipleOrgs ? (
              <OrgSelector
                selectedAccount={props.selectedAccount!}
                userId={props.userId!}
                accounts={props.accounts!}
                variant="pill"
              />
            ) : isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link
                to={href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
