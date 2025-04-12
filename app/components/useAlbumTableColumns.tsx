import {
  createColumnHelper,
  type CellContext,
  type ColumnDef,
  type RowData,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { formatDuration } from "~/lib/duration";
import { isTagSuspicious } from "~/lib/tags/musicMetadataShared";
import { EditableCell } from "./EditableCell";
import { type StoreTrack, type StoreTrackUpdatable } from "./useMetadataStore";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    classNameFn?: (ctx: CellContext<TData, TValue>) => string;
    hiddenByDefault?: boolean;
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

const columnHelper = createColumnHelper<StoreTrack>();

export const albumTableColumns: ColumnDef<StoreTrack, any>[] = [
  columnHelper.accessor("filename", {
    header: "Filename",
    id: "filename",
    meta: {
      className: "px-3 py-2 text-xs",
    },
  }),
  columnHelper.accessor("discNumber", {
    header: "Disc #",
    id: "discNumber",
    cell: createEditableCellRenderer("discNumber", "number", 1),
    size: 32,
    enableResizing: false,
  }),
  columnHelper.accessor("trackNumber", {
    header: "Track #",
    id: "trackNumber",
    cell: createEditableCellRenderer("trackNumber", "number", 1),
    size: 32,
    enableResizing: false,
  }),
  columnHelper.accessor("title", {
    header: "Title",
    id: "title",
    cell: createEditableCellRenderer("title"),
  }),
  columnHelper.accessor("artists", {
    header: "Artists",
    id: "artists",
    cell: createEditableCellRenderer("artists"),
  }),
  columnHelper.accessor("album", {
    header: "Album",
    id: "album",
    cell: createEditableCellRenderer("album"),
    meta: {
      hiddenByDefault: true,
    },
  }),
  columnHelper.accessor("albumArtist", {
    header: "Album Artist",
    id: "albumArtist",
    cell: createEditableCellRenderer("albumArtist"),
    meta: {
      hiddenByDefault: true,
    },
  }),
  columnHelper.accessor("duration", {
    header: "Duration",
    id: "duration",
    cell: (ctx) => formatDuration(ctx.getValue() * 1000),
    size: 36,
    enableResizing: false,
    meta: {
      className: "px-3 py-2",
    },
  }),
  columnHelper.accessor("container", {
    header: "Container",
    id: "container",
    size: 48,
    meta: {
      hiddenByDefault: true,
      className: "px-3 py-2",
    },
  }),
  columnHelper.accessor("codec", {
    header: "Codec",
    id: "codec",
    size: 48,
    meta: {
      hiddenByDefault: true,
      className: "px-3 py-2",
    },
  }),
  columnHelper.accessor("tagTypes", {
    header: "Tag Types",
    id: "tagTypes",
    cell: (ctx) => {
      const sus = isTagSuspicious(
        ctx.row.original.container,
        ctx.row.original.tagTypes,
      );
      return (
        <span className={sus ? "text-red-500" : undefined}>
          {ctx.getValue().join(", ")}
        </span>
      );
    },
    size: 48,
    meta: {
      hiddenByDefault: true,
      className: "px-3 py-2",
    },
  }),
];

interface UseAlbumTableColumnsReturn {
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function useAlbumTableColumns(
  originalTracks: StoreTrack[],
): UseAlbumTableColumnsReturn {
  // Initialize column visibility - all visible except album by default
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const out: Record<string, boolean> = {};
    albumTableColumns.forEach((column) => {
      const id = column.id;
      if (!id) return;
      out[id] = !column.meta?.hiddenByDefault;
    });
    return out;
  });

  // Show some of the hidden-by-default columns under certain conditions
  useEffect(() => {
    if (originalTracks.length > 0) {
      // If there's more than one album, show the album column
      const uniqueAlbums = new Set(
        originalTracks.map((track) => track.album).filter(Boolean),
      );
      if (uniqueAlbums.size > 1) {
        setColumnVisibility((prev) => ({
          ...prev,
          album: true,
        }));
      }

      // If the track has a suspicious container/tag combination, show the container and tag types columns
      const suspicious = originalTracks.some((t) =>
        isTagSuspicious(t.container, t.tagTypes),
      );
      if (suspicious) {
        setColumnVisibility((prev) => ({
          ...prev,
          container: true,
          tagTypes: true,
        }));
      }
    }
  }, [originalTracks]);

  return {
    columnVisibility,
    setColumnVisibility,
  };
}
