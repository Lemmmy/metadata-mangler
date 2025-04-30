import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row,
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  memo,
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import isEqual from "react-fast-compare";
import { type StoreTrack } from "~/components/album/useMetadataStore";
import { noop } from "~/lib/noop";
import { cn } from "~/lib/utils";
import { albumTableColumns } from "./useAlbumTableColumns";

interface Props {
  tracks: StoreTrack[];
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function AlbumTracksTable({
  tracks,
  columnVisibility,
  setColumnVisibility,
}: Props) {
  const table = useReactTable<StoreTrack>({
    data: tracks,
    columns: albumTableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    defaultColumn: {
      minSize: 20,
      maxSize: 1000,
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

    // We need these in the dependency array
    noop(columnSizingInfo, columnSizing, columnVisibility);

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }

    return colSizes;
  }, [columnSizingInfo, columnSizing, columnVisibility, getFlatHeaders]);

  return (
    <div
      className="border-border h-full min-h-[320px] overflow-auto border shadow-md"
      style={columnSizeVars}
    >
      <table className="divide-border max-h-full w-full table-fixed border-collapse divide-y">
        <thead className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    "bg-muted text-muted-foreground px-3 py-2 text-left text-xs font-medium tracking-wider uppercase",
                    "sticky top-0 select-none",
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
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <TableBody
          rows={table.getRowModel().rows}
          data={table.options.data}
          columnVisibility={columnVisibility}
        />
      </table>
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
  }) {
    "use no memo"; // Issue with react-compiler and column visibility changing

    return (
      <tbody className="divide-border bg-card divide-y">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/50">
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={cn(
                  "text-card-foreground border-l-border h-0 border-l",
                  cell.column.columnDef.meta?.className,
                  cell.column.columnDef.meta?.classNameFn?.(cell.getContext()),
                )}
                style={{
                  width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  },
  (prev, next) =>
    prev.rows.length === next.rows.length &&
    prev.data === next.data &&
    isEqual(prev.columnVisibility, next.columnVisibility),
);
