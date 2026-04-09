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

import { Table } from '../shadcn/table';
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
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  onRowClick?: (row: T) => void;
  totalCount?: number;
  onPageSizeChange?: (pageSize: number) => void;
  emptyStateProps?: { heading: string; description?: string };
  tableProps?: React.ComponentProps<typeof Table> &
    Record<`data-${string}`, string>;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
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
  rowSelection: externalRowSelection,
  onRowClick,
  onRowSelectionChange,
  totalCount,
  onPageSizeChange,
  emptyStateProps,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange: externalOnColumnVisibilityChange,
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
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({});

  const rowSelection = externalRowSelection ?? internalRowSelection;

  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = externalOnColumnVisibilityChange
    ? externalOnColumnVisibilityChange
    : setInternalColumnVisibility;

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
    onColumnVisibilityChange: (updater) => {
      const nextState =
        typeof updater === 'function' ? updater(columnVisibility) : updater;
      setColumnVisibility(nextState);
    },
    onRowSelectionChange: (updater) => {
      const nextSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;

      if (!externalRowSelection) {
        setInternalRowSelection(nextSelection);
      }

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
          className="w-max min-w-full caption-bottom text-sm"
          {...tableProps}
        >
          <thead className="[&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="hover:bg-muted/50 border-b transition-colors"
              >
                {headerGroup.headers.map((header, index) => {
                  const isSelect = header.column.id === '_select';
                  const isExpand = header.column.id === '_expand_cols';
                  const hasSelectCol =
                    headerGroup.headers[0]?.column.id === '_select';
                  const firstDataIndex = hasSelectCol ? 1 : 0;
                  const isFirstData =
                    !isSelect && !isExpand && index === firstDataIndex;
                  const isFrozenLeft = isSelect || isFirstData;
                  const isFrozen = isFrozenLeft || isExpand;
                  const stickyLeft = isSelect ? 0 : hasSelectCol ? 40 : 0;

                  return (
                    <th
                      colSpan={header.colSpan}
                      style={{
                        width: isSelect
                          ? 40
                          : isExpand
                            ? 32
                            : header.column.getSize(),
                        position: 'sticky' as const,
                        top: 0,
                        ...(isFrozenLeft ? { left: stickyLeft } : {}),
                        ...(isExpand ? { right: 0 } : {}),
                        zIndex: isFrozen ? 30 : 20,
                      }}
                      key={header.id}
                      className={`bg-background text-muted-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap ${isFirstData ? 'border-r' : ''} ${isExpand ? 'border-l' : ''}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="[&_tr:last-child]:border-0">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={`hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isSelect = cell.column.id === '_select';
                    const isExpand = cell.column.id === '_expand_cols';
                    const cells = row.getVisibleCells();
                    const hasSelectCol = cells[0]?.column.id === '_select';
                    const firstDataIndex = hasSelectCol ? 1 : 0;
                    const isFirstData =
                      !isSelect && !isExpand && index === firstDataIndex;
                    const isFrozenLeft = isSelect || isFirstData;
                    const isFrozen = isFrozenLeft || isExpand;
                    const stickyLeft = isSelect ? 0 : hasSelectCol ? 40 : 0;

                    return (
                      <td
                        key={cell.id}
                        style={
                          isFrozen
                            ? {
                                position: 'sticky' as const,
                                ...(isFrozenLeft ? { left: stickyLeft } : {}),
                                ...(isExpand ? { right: 0 } : {}),
                                zIndex: 10,
                              }
                            : undefined
                        }
                        className={`p-2 align-middle whitespace-nowrap ${isFrozen ? 'bg-background' : ''} ${isFirstData ? 'border-r' : ''} ${isExpand ? 'border-l' : ''}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
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

      <div className="bg-background shrink-0 border-t px-2 py-1">
        <DataTablePagination
          table={table}
          totalCount={totalCount}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}
