/* eslint-disable react-compiler/react-compiler */
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import { memo, type Dispatch, type SetStateAction } from "react";
import isEqual from "react-fast-compare";
import { useShallow } from "zustand/react/shallow";
import {
  useMetadataStore,
  type StoreTrack,
} from "~/components/album/useMetadataStore";
import { useTableResize } from "~/components/table/useTableResize";
import { cn } from "~/lib/utils";
import { albumTableColumns } from "./useAlbumTableColumns";

interface Props {
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

const getRowId = (row: StoreTrack) => `${row.directory}/${row.filename}`;
const defaultColumn = {
  size: 300,
  minSize: 20,
  maxSize: Number.MAX_VALUE,
} as const;

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

  const table = useReactTable<StoreTrack>({
    getRowId,
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
