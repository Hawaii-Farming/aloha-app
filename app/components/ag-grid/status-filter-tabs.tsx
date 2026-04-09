import { useSearchParams } from 'react-router';

import { Button } from '@aloha/ui/button';

import type { WorkflowConfig } from '~/lib/crud/types';

interface StatusFilterTabsProps {
  workflow: WorkflowConfig;
}

function StatusFilterTabs({ workflow }: StatusFilterTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = searchParams.get('filter_status') ?? '';

  const handleClick = (status: string) => {
    const next = new URLSearchParams(searchParams);

    if (status === '') {
      next.delete('filter_status');
    } else {
      next.set('filter_status', status);
    }

    next.set('page', '1');
    setSearchParams(next, { preventScrollReset: true });
  };

  return (
    <div className="flex items-center gap-1" data-test="status-filter-tabs">
      <Button
        size="sm"
        variant={activeStatus === '' ? 'secondary' : 'ghost'}
        onClick={() => handleClick('')}
        data-test="status-tab-all"
      >
        All
      </Button>

      {Object.entries(workflow.states).map(([key, state]) => (
        <Button
          key={key}
          size="sm"
          variant={activeStatus === key ? 'secondary' : 'ghost'}
          onClick={() => handleClick(key)}
          data-test={`status-tab-${key}`}
        >
          {state.label}
        </Button>
      ))}
    </div>
  );
}

export { StatusFilterTabs };
