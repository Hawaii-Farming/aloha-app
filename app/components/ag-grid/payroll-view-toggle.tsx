import { useSearchParams } from 'react-router';

import { Button } from '@aloha/ui/button';

export function PayrollViewToggle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') ?? 'by_task';

  const handleToggle = (view: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', view);
    setSearchParams(next, { preventScrollReset: true });
  };

  return (
    <div className="flex items-center gap-1" data-test="payroll-view-toggle">
      <Button
        size="sm"
        variant={currentView === 'by_task' ? 'secondary' : 'ghost'}
        onClick={() => handleToggle('by_task')}
        data-test="view-toggle-by-task"
      >
        By Department
      </Button>
      <Button
        size="sm"
        variant={currentView === 'by_employee' ? 'secondary' : 'ghost'}
        onClick={() => handleToggle('by_employee')}
        data-test="view-toggle-by-employee"
      >
        By Employee
      </Button>
    </div>
  );
}
