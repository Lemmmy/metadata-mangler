import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  memo,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import isEqual from "react-fast-compare";
import {
  useMetadataStore,
  type StoreTrack,
} from "~/components/album/useMetadataStore";
import { noop } from "~/lib/noop";
import { cn } from "~/lib/utils";
import { albumTableColumns } from "./useAlbumTableColumns";
import { useMeasure } from "@uidotdev/usehooks";
import { useShallow } from "zustand/react/shallow";

interface Props {
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function AlbumTracksTable({
  columnVisibility,
  setColumnVisibility,
}: Props) {
  "use no memo";
  const { tracks, selectedTracks, setSelectedTracks } = useMetadataStore(
    useShallow((s) => ({
      tracks: s.tracks,
      selectedTracks: s.selectedTracks,
      setSelectedTracks: s.setSelectedTracks,
    })),
  );

  // Measure width for column sizing
  const [tableRef, { width }] = useMeasure();

  const table = useReactTable<StoreTrack>({
    getRowId: (row) => `${row.directory}/${row.filename}`,
    data: tracks,
    columns: albumTableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    enableRowSelection: true,
    state: {
      columnVisibility,
      rowSelection: selectedTracks,
    },
    onRowSelectionChange: setSelectedTracks,
    onColumnVisibilityChange: setColumnVisibility,
    defaultColumn: {
      size: 300,
      minSize: 20,
      maxSize: Number.MAX_VALUE,
    },
  });

  const columnSizingInfo = table.getState().columnSizingInfo;
  const columnSizing = table.getState().columnSizing;

  const resetColumnSizing = table.resetColumnSizing;
  const getFlatHeaders = table.getFlatHeaders;

  useEffect(() => {
    resetColumnSizing();
  }, [columnVisibility, resetColumnSizing]);

  // https://tanstack.com/table/v8/docs/framework/react/examples/column-resizing-performant
  const columnSizeVars = useMemo(() => {
    const headers = getFlatHeaders();
    const colSizes: { [key: string]: number } = {};

    // We need these in the dependency array to re-render the table body
    noop(columnSizingInfo, columnSizing, columnVisibility, selectedTracks);

    // Calculate total width of all columns
    let totalWidth = 0;
    const resizableHeaders: typeof headers = [];
    const fixedHeaders: typeof headers = [];

    // First pass: separate fixed and resizable columns, calculate total width
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      const canResize = header.column.getCanResize();

      if (canResize) {
        resizableHeaders.push(header);
      } else {
        fixedHeaders.push(header);
      }

      totalWidth += header.getSize();
    }

    // Calculate width of fixed columns
    const fixedWidth = fixedHeaders.reduce(
      (sum, header) => sum + header.getSize(),
      0,
    );

    // Calculate scaling factor if needed
    let scalingFactor = 1;
    if (width && totalWidth > width && resizableHeaders.length > 0) {
      // Calculate how much width we have for resizable columns
      const availableWidth = width - fixedWidth;
      const resizableWidth = totalWidth - fixedWidth;

      // Calculate scaling factor to fit all columns
      scalingFactor = Math.max(0.3, availableWidth / resizableWidth);
    }

    // Apply sizes with scaling if needed
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      const canResize = header.column.getCanResize();

      // Apply scaling only to resizable columns
      const size = canResize
        ? Math.max(
            header.column.columnDef.minSize || 48,
            Math.floor(header.getSize() * scalingFactor),
          )
        : header.getSize();

      colSizes[`--header-${header.id}-size`] = size;
      colSizes[`--col-${header.column.id}-size`] = size;
    }

    return colSizes;
  }, [
    columnSizingInfo,
    columnSizing,
    columnVisibility,
    selectedTracks,
    getFlatHeaders,
    width,
  ]);

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
                )}
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

                {header.column.columnDef.meta?.headerExtra &&
                  flexRender(
                    header.column.columnDef.meta.headerExtra,
                    header.getContext(),
                  )}

                {/* Resize handle */}
                {header.column.getCanResize() && (
                  <div
                    className={cn(
                      "absolute top-0 right-0 bottom-0 w-[4px] cursor-col-resize",
                      "hover:bg-border bg-transparent transition-colors",
                      header.column.getIsResizing() && "bg-blue-500/50",
                    )}
                    onDoubleClick={header.column.resetSize}
                    onMouseDown={header.getResizeHandler()}
                    onMouseUp={header.getResizeHandler()}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Body */}
      <TableBody
        rows={table.getRowModel().rows}
        data={table.options.data}
        columnVisibility={columnVisibility}
        selectedTracks={selectedTracks}
      />
    </div>
  );
}

const TableBody = memo(
  function TableBody({
    rows,
  }: {
    rows: Row<StoreTrack>[];
    data: StoreTrack[];
    columnVisibility: VisibilityState; // Passed in to re-render on column visibility change
    selectedTracks: RowSelectionState;
  }) {
    "use no memo"; // Issue with react-compiler and column visibility changing

    return (
      <div className="divide-border bg-card flex flex-col divide-y">
        {rows.map((row) => (
          <div key={row.id} className="hover:bg-muted/50 flex w-full">
            {row.getVisibleCells().map((cell) => (
              <div
                key={cell.id}
                className={cn(
                  "text-card-foreground border-l-border flex items-center border-l",
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
    isEqual(prev.selectedTracks, next.selectedTracks),
);
