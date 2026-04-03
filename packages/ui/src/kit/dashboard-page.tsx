import { cn } from '../lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../shadcn/card';

interface DashboardWidgetProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

export function DashboardWidget({
  title,
  className,
  children,
}: DashboardWidgetProps) {
  return (
    <Card className={className} data-test="dashboard-widget">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface DashboardPageProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardPage({ children, className }: DashboardPageProps) {
  return (
    <div
      className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}
      data-test="dashboard-page"
    >
      {children}
    </div>
  );
}
