import {
  createColumnHelper,
  type CellContext,
  type ColumnDef,
  type RowData,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { formatDuration } from "~/lib/duration";
import { EditableCell } from "./EditableCell";
import { type StoreTrack, type StoreTrackUpdatable } from "./useMetadataStore";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    classNameFn?: (ctx: CellContext<TData, TValue>) => string;
  }
}

function createEditableCellRenderer(
  field: StoreTrackUpdatable,
  type: "text" | "number" = "text",
  min?: number,
) {
  return function cellRenderer(info: CellContext<StoreTrack, unknown>) {
    return (
      <EditableCell
        value={info.getValue() as string | number}
        index={info.row.index}
        field={field}
        type={type}
        min={min}
      />
    );
  };
}

interface UseAlbumTableColumnsReturn {
  columns: ColumnDef<StoreTrack>[];
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function useAlbumTableColumns(
  originalTracks: StoreTrack[],
): UseAlbumTableColumnsReturn {
  // Initialize column visibility - all visible except album by default
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    filename: true,
    trackNumber: true,
    discNumber: true,
    title: true,
    artists: true,
    album: false, // Hidden by default
    duration: true,
  });

  // Check if there are multiple albums in the original tracks
  useEffect(() => {
    if (originalTracks.length > 0) {
      const uniqueAlbums = new Set(
        originalTracks.map((track) => track.album).filter(Boolean),
      );

      // If there's more than one album, show the album column
      if (uniqueAlbums.size > 1) {
        setColumnVisibility((prev) => ({
          ...prev,
          album: true,
        }));
      }
    }
  }, [originalTracks]);

  const columnHelper = createColumnHelper<StoreTrack>();
  const columns: ColumnDef<StoreTrack, any>[] = useMemo(
    () => [
      columnHelper.accessor("filename", {
        header: "Filename",
        meta: {
          className: "px-3 py-2 text-xs",
        },
      }),
      columnHelper.accessor("discNumber", {
        header: "Disc #",
        cell: createEditableCellRenderer("discNumber", "number", 1),
        size: 32,
        enableResizing: false,
      }),
      columnHelper.accessor("trackNumber", {
        header: "Track #",
        cell: createEditableCellRenderer("trackNumber", "number", 1),
        size: 32,
        enableResizing: false,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: createEditableCellRenderer("title"),
      }),
      columnHelper.accessor("artists", {
        header: "Artists",
        cell: createEditableCellRenderer("artists"),
      }),
      columnHelper.accessor("album", {
        header: "Album",
        cell: createEditableCellRenderer("album"),
      }),
      columnHelper.accessor("duration", {
        header: "Duration",
        cell: (ctx) => formatDuration(ctx.getValue() * 1000),
        size: 36,
        enableResizing: false,
        meta: {
          className: "px-3 py-2",
        },
      }),
    ],
    [columnHelper],
  );

  return {
    columns,
    columnVisibility,
    setColumnVisibility,
  };
}
