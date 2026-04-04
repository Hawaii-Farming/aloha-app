'use client';

import { useMemo, useState } from 'react';

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../shadcn/table';
import {
  DataTablePagination,
  useNavigateToNewPage,
} from './data-table-pagination';
import { EmptyState, EmptyStateHeading, EmptyStateText } from './empty-state';

interface ReactTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  renderSubComponent?: (props: { row: Row<T> }) => React.ReactElement;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  manualPagination?: boolean;
  manualSorting?: boolean;
  sorting?: SortingState;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  onRowClick?: (row: T) => void;
  totalCount?: number;
  onPageSizeChange?: (pageSize: number) => void;
  emptyStateProps?: { heading: string; description?: string };
  tableProps?: React.ComponentProps<typeof Table> &
    Record<`data-${string}`, string>;
}

export function DataTable<T extends object>({
  data,
  columns,
  pageIndex,
  pageSize,
  pageCount,
  onPaginationChange,
  onSortingChange,
  tableProps,
  manualPagination = true,
  manualSorting = false,
  sorting: initialSorting,
  enableRowSelection = false,
  onRowClick,
  onRowSelectionChange,
  totalCount,
  onPageSizeChange,
  emptyStateProps,
}: ReactTableProps<T>) {
  // Derive pagination from props on every render (server-driven)
  const paginationState = useMemo<PaginationState>(
    () => ({
      pageIndex: pageIndex ?? 0,
      pageSize: pageSize ?? 25,
    }),
    [pageIndex, pageSize],
  );

  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const navigateToPage = useNavigateToNewPage();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination,
    manualSorting,
    enableRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const nextSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;

      setRowSelection(nextSelection);

      if (onRowSelectionChange) {
        onRowSelectionChange(nextSelection);
      }
    },
    pageCount,
    state: {
      pagination: paginationState,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: (updater) => {
      if (typeof updater === 'function') {
        const nextState = updater(sorting);

        setSorting(nextState);

        if (onSortingChange) {
          onSortingChange(nextState);
        }
      } else {
        setSorting(updater);

        if (onSortingChange) {
          onSortingChange(updater);
        }
      }
    },
    onPaginationChange: (updater) => {
      const navigate = (page: number) => setTimeout(() => navigateToPage(page));

      const nextState =
        typeof updater === 'function' ? updater(paginationState) : updater;

      if (onPaginationChange) {
        onPaginationChange(nextState);
      } else {
        navigate(nextState.pageIndex);
      }
    },
  });

  return (
    <div className={'flex flex-1 flex-col overflow-hidden rounded-lg border'}>
      <div className="relative flex-1 overflow-auto">
        <table
          className="w-full caption-bottom text-sm"
          {...tableProps}
        >
          <thead className="bg-background sticky top-0 z-10 [&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="hover:bg-muted/50 border-b transition-colors"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    colSpan={header.colSpan}
                    style={{ width: header.column.getSize() }}
                    key={header.id}
                    className="bg-background text-muted-foreground h-10 px-2 text-left align-middle font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="[&_tr:last-child]:border-0">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={`hover:bg-muted/50 border-b transition-colors data-[state=selected]:bg-muted ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <EmptyState className="border-none shadow-none">
                    <EmptyStateHeading>
                      {emptyStateProps?.heading ?? 'No records found'}
                    </EmptyStateHeading>

                    {emptyStateProps?.description ? (
                      <EmptyStateText>
                        {emptyStateProps.description}
                      </EmptyStateText>
                    ) : null}
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t bg-background px-2 py-1">
        <DataTablePagination
          table={table}
          totalCount={totalCount}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}
