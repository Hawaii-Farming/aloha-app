'use client';

import { useCallback } from 'react';

import { useSearchParams } from 'react-router';

import type { Table as ReactTable } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '../shadcn/button';
import { Trans } from './trans';

interface DataTablePaginationProps<TData> {
  table: ReactTable<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground text-sm">
        {selectedCount > 0 ? (
          <Trans
            i18nKey="common:rowsSelected"
            values={{ count: selectedCount, total: totalCount }}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-x-4">
        <span className="text-muted-foreground flex items-center text-sm">
          <Trans
            i18nKey="common:pageOfPages"
            values={{
              page: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            }}
          />
        </span>

        <div className="flex items-center gap-x-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useNavigateToNewPage(
  props: { pageParam?: string } = {
    pageParam: 'page',
  },
) {
  const [, setSearchParams] = useSearchParams();
  const param = props.pageParam ?? 'page';

  return useCallback(
    (pageIndex: number) => {
      setSearchParams({
        [param]: String(pageIndex + 1),
      });
    },
    [param, setSearchParams],
  );
}
