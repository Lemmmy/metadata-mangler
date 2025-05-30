import { useMutation } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  useVirtualizer,
  Virtualizer,
  type VirtualItem,
} from "@tanstack/react-virtual";
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from "lucide-react";
import {
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import isEqual from "react-fast-compare";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
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
import { useDiscographyStore } from "./useDiscographyStore";
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
  const {
    includeIgnoredVgmdbRoles,
    selectedReleaseIds,
    setSelectedReleaseIds,
  } = useDiscographyStore(
    useShallow((s) => ({
      includeIgnoredVgmdbRoles: s.includeIgnoredVgmdbRoles[s.discographyId],
      selectedReleaseIds: s.selectedReleaseIds,
      setSelectedReleaseIds: s.setSelectedReleaseIds,
    })),
  );

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
    enableRowSelection: true,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      columnVisibility,
      rowSelection: selectedReleaseIds,
    },
    onRowSelectionChange: setSelectedReleaseIds,
    onColumnVisibilityChange: setColumnVisibility,
    defaultColumn,
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { tableRef, columnSizeVars } = useTableResize(table, columnVisibility);
  useImperativeHandle(
    tableRef,
    () => tableContainerRef.current as HTMLDivElement,
  );

  return (
    <div
      ref={tableContainerRef}
      className="border-border flex min-h-[320px] flex-col overflow-auto border shadow-md"
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
        selectedReleaseIds={selectedReleaseIds}
        sorting={sorting}
        tableRef={tableContainerRef}
      />
    </div>
  );
}

export function RolesCell({ value }: { value: string | null }) {
  const { includeIgnoredVgmdbRoles } = useDiscographyStore(
    useShallow((s) => ({
      includeIgnoredVgmdbRoles: s.includeIgnoredVgmdbRoles[s.discographyId],
    })),
  );

  return (
    <div className="line-clamp-2" title={value ?? ""}>
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
      <SelectTrigger
        className={cn("w-full flex-1 rounded-none border-0", {
          "!bg-lime-500/30": internalValue === "obtained_lossless",
          "!bg-red-500/30": internalValue === "obtained_lossy",
          "!bg-black/30": internalValue === "skipped",
        })}
      >
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
    selectedReleaseIds,
    tableRef,
  }: {
    rows: Row<WebDiscographyRelease>[];
    data: WebDiscographyRelease[];
    columnVisibility: VisibilityState;
    sorting: SortingState;
    selectedReleaseIds: RowSelectionState;
    tableRef: RefObject<HTMLDivElement | null>;
  }) {
    // eslint-disable-next-line react-compiler/react-compiler
    "use no memo";

    // Add state to force re-render after initial height calculation
    const [heightInitialized, setHeightInitialized] = useState(false);

    const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
      count: rows.length,
      estimateSize: () => 36,
      getScrollElement: () => tableRef.current,
      measureElement:
        typeof window !== "undefined" &&
        navigator.userAgent.indexOf("Firefox") === -1
          ? (element) => element?.getBoundingClientRect().height
          : undefined,
      overscan: 5,
    });

    // Force a re-render after the height is first populated
    const totalSize = rowVirtualizer.getTotalSize();
    useEffect(() => {
      if (!heightInitialized && totalSize > 0) {
        setHeightInitialized(true);
      }
    }, [totalSize, heightInitialized, rowVirtualizer]);

    return (
      <div
        className="divide-border relative flex flex-col divide-y"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((row) => (
          <TableBodyRow
            key={row.key}
            row={rows[row.index]}
            virtualRow={row}
            rowVirtualizer={rowVirtualizer}
            selectedReleaseIds={selectedReleaseIds}
          />
        ))}
      </div>
    );
  },
  (prev, next) =>
    prev.rows.length === next.rows.length &&
    prev.data === next.data &&
    isEqual(prev.columnVisibility, next.columnVisibility) &&
    isEqual(prev.sorting, next.sorting) &&
    isEqual(prev.selectedReleaseIds, next.selectedReleaseIds),
);

function TableBodyRow({
  row,
  virtualRow,
  rowVirtualizer,
}: {
  row: Row<WebDiscographyRelease>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>;
  selectedReleaseIds: RowSelectionState;
}) {
  // eslint-disable-next-line react-compiler/react-compiler
  "use no memo";

  return (
    <div
      data-index={virtualRow.index}
      ref={(node) => rowVirtualizer.measureElement(node)}
      key={row.id}
      className="bg-card hover:bg-muted/50 absolute flex w-full"
      style={{
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
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
  );
}
