'use client';

import { useCallback } from 'react';

import { useSearchParams } from 'react-router';

import type { Table as ReactTable } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Button } from '../shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn/select';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

interface DataTablePaginationProps<TData> {
  table: ReactTable<TData>;
  totalCount?: number;
  onPageSizeChange?: (pageSize: number) => void;
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const currentPageSize = table.getState().pagination.pageSize;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount();
  const recordCount = totalCount ?? table.getFilteredRowModel().rows.length;

  const from = (currentPage - 1) * currentPageSize + 1;
  const to = Math.min(currentPage * currentPageSize, recordCount);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground whitespace-nowrap">
        {recordCount > 0
          ? `${from}–${to} of ${recordCount}`
          : '0 records'}
      </span>

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-muted-foreground min-w-[3rem] text-center text-xs">
          {currentPage} / {pageCount}
        </span>

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {onPageSizeChange && (
        <Select
          value={String(currentPageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-7 w-[65px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
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
