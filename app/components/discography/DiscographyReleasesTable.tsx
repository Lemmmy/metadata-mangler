import { useMutation } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import isEqual from "react-fast-compare";
import { toast } from "sonner";
import type { WebDiscographyRelease } from "~/api/discography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { DiscographyObtainStatus } from "~/lib/db";
import { areAllRolesIgnored, cleanVgmdbRoles } from "~/lib/fetch/vgmdbUtils";
import { useTRPC } from "~/lib/trpc";
import { cn } from "~/lib/utils";
import { useTableResize } from "../table/useTableResize";
import { useDiscographyContext } from "./DiscographyContext";
import {
  discographyTableColumns,
  type UseDiscographyTableColumnsReturn,
} from "./useDiscographyTableColumns";

interface Props extends UseDiscographyTableColumnsReturn {
  releases: WebDiscographyRelease[];
}

const getRowId = (row: WebDiscographyRelease) => row._id.toString();
const defaultSorting: SortingState = [{ id: "releaseDate", desc: false }];
const defaultColumn = {
  size: 300,
  minSize: 20,
  maxSize: Number.MAX_VALUE,
} as const;

export function DiscographyReleasesTable({
  releases,
  columnVisibility,
  setColumnVisibility,
}: Props) {
  // eslint-disable-next-line react-compiler/react-compiler
  "use no memo";
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const { includeIgnoredVgmdbRoles } = useDiscographyContext();

  // If includeIgnoredVgmdbRoles is false, hide all the rows that only contain ignored roles
  const filteredData = useMemo(() => {
    if (includeIgnoredVgmdbRoles) return releases;
    return releases.filter(
      (r) => !r.vgmdbRole || !areAllRolesIgnored(r.vgmdbRole),
    );
  }, [releases, includeIgnoredVgmdbRoles]);

  const table = useReactTable({
    getRowId,
    data: filteredData,
    columns: discographyTableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    defaultColumn,
  });

  const { tableRef, columnSizeVars } = useTableResize(table, columnVisibility);

  return (
    <div
      ref={tableRef}
      className="border-border flex h-full min-h-[320px] flex-col overflow-auto border shadow-md"
      style={columnSizeVars}
    >
      {/* Header */}
      <div className="bg-muted sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <div key={headerGroup.id} className="flex w-full">
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className={cn(
                  "bg-muted text-muted-foreground px-3 py-2 text-left text-xs font-medium tracking-wider uppercase",
                  "inset-x relative flex flex-shrink-0 flex-grow-0 items-center select-none",
                  "before:absolute before:inset-y-0 before:left-0 before:block before:!w-px before:bg-zinc-700",
                  header.column.getCanSort() && "cursor-pointer select-none",
                )}
                onClick={header.column.getToggleSortingHandler()}
                style={{
                  width: `calc(var(--header-${header?.id}-size) * 1px)`,
                }}
              >
                {/* Header cell contents */}
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}

                {/* Sort indicator */}
                <span className="ml-2">
                  {{
                    asc: <ArrowDownNarrowWide className="size-4" />,
                    desc: <ArrowDownWideNarrow className="size-4" />,
                  }[header.column.getIsSorted() as string] ?? null}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Body */}
      <TableBody
        rows={table.getRowModel().rows}
        data={table.options.data}
        columnVisibility={table.getState().columnVisibility}
        sorting={sorting}
      />
    </div>
  );
}

export function RolesCell({ value }: { value: string | null }) {
  const { includeIgnoredVgmdbRoles } = useDiscographyContext();
  return (
    <div className="line-clamp-2">
      {value ? cleanVgmdbRoles(value, includeIgnoredVgmdbRoles) : null}
    </div>
  );
}

export const StatusCell = memo(function StatusCell({
  value,
  id,
}: {
  value: DiscographyObtainStatus;
  id: string;
}) {
  const [internalValue, setInternalValue] = useState(value);
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const trpc = useTRPC();
  const { mutateAsync } = useMutation(
    trpc.discography.updateReleaseStatus.mutationOptions(),
  );

  const handleStatusChange = async (newStatus: DiscographyObtainStatus) => {
    try {
      setInternalValue(newStatus);
      await mutateAsync({
        releaseId: id,
        status: newStatus,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <Select value={internalValue} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-full flex-1 rounded-none border-0">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unobtained">Unobtained</SelectItem>
        <SelectItem value="obtained_lossless">Obtained (Lossless)</SelectItem>
        <SelectItem value="obtained_lossy">Obtained (Lossy)</SelectItem>
        <SelectItem value="skipped">Skipped</SelectItem>
      </SelectContent>
    </Select>
  );
});

const TableBody = memo(
  function TableBody({
    rows,
  }: {
    rows: Row<WebDiscographyRelease>[];
    data: WebDiscographyRelease[];
    columnVisibility: VisibilityState;
    sorting: SortingState;
  }) {
    // eslint-disable-next-line react-compiler/react-compiler
    "use no memo";
    return (
      <div className="divide-border bg-card flex flex-col divide-y">
        {rows.map((row) => (
          <div key={row.id} className="hover:bg-muted/50 flex w-full">
            {row.getVisibleCells().map((cell) => (
              <div
                key={cell.id}
                className={cn(
                  "text-card-foreground border-l-border flex items-center border-l px-2 py-1 text-xs",
                  cell.column.columnDef.meta?.className,
                  cell.column.columnDef.meta?.classNameFn?.(cell.getContext()),
                )}
                style={{
                  width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                  flexShrink: 0,
                  flexGrow: 0,
                }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
  (prev, next) =>
    prev.rows.length === next.rows.length &&
    prev.data === next.data &&
    isEqual(prev.columnVisibility, next.columnVisibility) &&
    isEqual(prev.sorting, next.sorting),
);
