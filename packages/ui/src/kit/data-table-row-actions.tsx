'use client';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '../shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../shadcn/dropdown-menu';

interface RowAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  separator?: boolean;
}

interface DataTableRowActionsProps {
  actions: RowAction[];
}

export function DataTableRowActions({ actions }: DataTableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          data-test="row-actions"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <div key={index}>
            {action.separator && index > 0 ? <DropdownMenuSeparator /> : null}

            <DropdownMenuItem
              onClick={action.onClick}
              className={
                action.variant === 'destructive' ? 'text-destructive' : ''
              }
            >
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
