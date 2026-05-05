"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  emptyMessage?: string;
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  bulkActionsSlot?: React.ReactNode;
};

export function DataTable<TData>({
  columns,
  data,
  emptyMessage = "Không có dữ liệu phù hợp.",
  enableRowSelection = false,
  getRowId,
  selectedIds = [],
  onSelectedIdsChange,
  bulkActionsSlot,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const selectionEnabled =
    enableRowSelection && Boolean(getRowId) && Boolean(onSelectedIdsChange);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const headerCheckboxRef = React.useRef<HTMLInputElement | null>(null);

  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const visibleRowIds = React.useMemo(() => {
    if (!selectionEnabled || !getRowId) return [];
    return table.getRowModel().rows.map((row) => getRowId(row.original));
  }, [selectionEnabled, getRowId, table, data, sorting]);

  const allSelectedOnPage =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((id) => selectedSet.has(id));

  const someSelectedOnPage =
    visibleRowIds.length > 0 &&
    visibleRowIds.some((id) => selectedSet.has(id)) &&
    !allSelectedOnPage;

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelectedOnPage;
    }
  }, [someSelectedOnPage]);

  function toggleOne(id: string, checked: boolean) {
    if (!onSelectedIdsChange) return;

    if (checked) {
      onSelectedIdsChange(Array.from(new Set([...selectedIds, id])));
      return;
    }

    onSelectedIdsChange(selectedIds.filter((x) => x !== id));
  }

  function toggleAllOnPage(checked: boolean) {
    if (!onSelectedIdsChange) return;

    if (checked) {
      onSelectedIdsChange(Array.from(new Set([...selectedIds, ...visibleRowIds])));
      return;
    }

    const visibleSet = new Set(visibleRowIds);
    onSelectedIdsChange(selectedIds.filter((id) => !visibleSet.has(id)));
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      {bulkActionsSlot ? (
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          {bulkActionsSlot}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="border-slate-200">
              {selectionEnabled ? (
                <TableHead className="w-14 whitespace-nowrap px-4 py-4">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={(e) => toggleAllOnPage(e.target.checked)}
                    aria-label="Chọn tất cả các dòng trên trang này"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </TableHead>
              ) : null}

              {hg.headers.map((h) => {
                const canSort = h.column.getCanSort();

                return (
                  <TableHead
                    key={h.id}
                    className="whitespace-nowrap px-4 py-4 text-base font-semibold text-slate-800"
                  >
                    {h.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-slate-50"
                        onClick={h.column.getToggleSortingHandler()}
                        aria-label={`Sắp xếp theo ${String(
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}`}
                      >
                        <span>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </span>
                        <span className="text-sm text-slate-500">
                          {h.column.getIsSorted() === "asc"
                            ? "↑"
                            : h.column.getIsSorted() === "desc"
                            ? "↓"
                            : ""}
                        </span>
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((r) => {
              const rowId =
                selectionEnabled && getRowId ? getRowId(r.original) : null;
              const selected = rowId ? selectedSet.has(rowId) : false;

              return (
                <TableRow
                  key={r.id}
                  className={selected ? "bg-slate-50" : "bg-white"}
                >
                  {selectionEnabled ? (
                    <TableCell className="w-14 px-4 py-4 align-middle">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) =>
                          rowId && toggleOne(rowId, e.target.checked)
                        }
                        aria-label="Chọn dòng này"
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </TableCell>
                  ) : null}

                  {r.getVisibleCells().map((c) => (
                    <TableCell
                      key={c.id}
                      className="px-4 py-4 text-base leading-7 text-slate-700 align-middle"
                    >
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectionEnabled ? 1 : 0)}
                className="px-4 py-12 text-center text-base text-slate-600"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}