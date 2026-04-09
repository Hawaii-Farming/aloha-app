import { Fragment } from 'react';

import { Link, useLocation } from 'react-router';

const unslugify = (slug: string) =>
  slug.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function NavbarBreadcrumbs() {
  const pathname = useLocation().pathname;
  const segments = pathname.split('/').filter(Boolean);

  // Skip "home" and account segments — start from module
  const displaySegments = segments.slice(2);

  if (displaySegments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      {displaySegments.map((segment, index) => {
        const isLast = index === displaySegments.length - 1;
        const href = '/' + segments.slice(0, index + 3).join('/');
        const label = unslugify(segment);

        return (
          <Fragment key={index}>
            {index > 0 && (
              <span className="text-muted-foreground mx-1.5">/</span>
            )}
            {isLast ? (
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
