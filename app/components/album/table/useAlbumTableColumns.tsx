import {
  createColumnHelper,
  type CellContext,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import { getSelectionColumn } from "~/components/table/SelectionColumn";
import { useTableColumnVisibility } from "~/components/table/useTableColumnVisibility";
import { Button } from "~/components/ui/button";
import { formatDuration } from "~/lib/duration";
import { isTagSuspicious } from "~/lib/tags/musicMetadataShared";
import {
  useMetadataStore,
  type StoreTrack,
  type StoreTrackUpdatable,
} from "../useMetadataStore";
import { DebugButtons } from "./DebugButtons";
import { EditableCell } from "./EditableCell";

function createEditableCellRenderer(
  field: keyof StoreTrackUpdatable,
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
  getSelectionColumn(columnHelper),
  columnHelper.accessor("filename", {
    id: "filename",
    header: "Filename",
    meta: {
      className: "px-3 py-2 text-xs tabular-nums",
    },
  }),
  columnHelper.accessor("discNumber", {
    id: "discNumber",
    header: "Disc #",
    cell: createEditableCellRenderer("discNumber", "number", 1),
    size: 64,
    enableResizing: false,
    meta: {
      className: "tabular-nums",
    },
  }),
  columnHelper.accessor("trackNumber", {
    id: "trackNumber",
    header: "Track #",
    cell: createEditableCellRenderer("trackNumber", "number", 1),
    size: 64,
    enableResizing: false,
    meta: {
      className: "tabular-nums",
    },
  }),
  columnHelper.accessor("title", {
    id: "title",
    header: "Title",
    cell: createEditableCellRenderer("title"),
    size: 500,
  }),
  columnHelper.accessor("artists", {
    id: "artists",
    header: "Artists",
    cell: createEditableCellRenderer("artists"),
    size: 500,
  }),
  columnHelper.accessor("displayArtist", {
    id: "displayArtist",
    header: "Display artist",
    cell: createEditableCellRenderer("displayArtist"),
    meta: {
      visibility: "showIfExists",
      className: "text-red-500",
      headerExtra: () => (
        <Button
          variant="link"
          className="h-auto py-0"
          onClick={() => {
            const store = useMetadataStore.getState();
            for (let i = 0; i < store.tracks.length; i++) {
              store.updateTrack(i, "displayArtist", "");
            }
          }}
        >
          Remove all
        </Button>
      ),
    },
  }),
  columnHelper.accessor("album", {
    id: "album",
    header: "Album",
    cell: createEditableCellRenderer("album"),
    meta: {
      visibility: "showIfDiffers",
    },
  }),
  columnHelper.accessor("albumArtist", {
    id: "albumArtist",
    header: "Album artist",
    cell: createEditableCellRenderer("albumArtist"),
    meta: {
      visibility: "showIfDiffers",
    },
  }),
  columnHelper.accessor("year", {
    id: "year",
    header: "Year",
    cell: createEditableCellRenderer("year"),
    size: 72,
    meta: {
      visibility: "showIfDiffers",
      className: "tabular-nums",
    },
  }),
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: createEditableCellRenderer("date"),
    size: 128,
    meta: {
      visibility: "showIfDiffers",
      className: "tabular-nums",
    },
  }),
  columnHelper.accessor("grouping", {
    id: "grouping",
    header: "Grouping",
    cell: createEditableCellRenderer("grouping"),
    meta: {
      visibility: "showIfDiffers",
    },
  }),
  columnHelper.accessor("catalogNumber", {
    id: "catalogNumber",
    header: "Catalog",
    cell: createEditableCellRenderer("catalogNumber"),
    size: 128,
    meta: {
      visibility: "showIfDiffers",
    },
  }),
  columnHelper.accessor("barcode", {
    id: "barcode",
    header: "Barcode",
    cell: createEditableCellRenderer("barcode"),
    size: 128,
    meta: {
      visibility: "showIfDiffers",
    },
  }),
  columnHelper.accessor("albumSubtitle", {
    id: "albumSubtitle",
    header: "Album subtitle",
    cell: createEditableCellRenderer("albumSubtitle"),
    meta: {
      visibility: "showIfDiffers",
    },
  }),
  columnHelper.accessor("trackComment", {
    id: "trackComment",
    header: "Track comment",
    cell: createEditableCellRenderer("trackComment"),
    meta: {
      visibility: "showIfExists",
    },
  }),
  columnHelper.accessor("duration", {
    id: "duration",
    header: "Duration",
    cell: (ctx) => formatDuration(ctx.getValue() * 1000),
    size: 36,
    enableResizing: false,
    meta: {
      className: "px-3 py-2 tabular-nums",
    },
  }),
  columnHelper.accessor("container", {
    id: "container",
    header: "Container",
    size: 48,
    meta: {
      visibility: "showIfDiffers",
      className: "px-3 py-2",
    },
  }),
  columnHelper.accessor("codec", {
    id: "codec",
    header: "Codec",
    size: 48,
    meta: {
      visibility: "showIfDiffers",
      className: "px-3 py-2",
    },
  }),
  columnHelper.accessor("tagTypes", {
    id: "tagTypes",
    header: "Tag types",
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
      visibility: "showIfDiffers",
      className: "px-3 py-2",
    },
  }),
  columnHelper.display({
    id: "debug",
    header: "Debug",
    cell: (ctx) => <DebugButtons track={ctx.row.original} />,
    size: 48,
    meta: {
      visibility: "hiddenByDefault",
      className: "px-3 py-2",
    },
  }),
];

interface UseAlbumTableColumnsReturn {
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

function normalizeTag(tag: any): string {
  return Array.isArray(tag) ? [...tag].sort().join(",") : tag;
}

export function useAlbumTableColumns(
  originalTracks: StoreTrack[],
): UseAlbumTableColumnsReturn {
  const { columnVisibility, setColumnVisibility } = useTableColumnVisibility(
    albumTableColumns,
    originalTracks,
    normalizeTag,
  );

  // Show some of the hidden-by-default columns under certain conditions
  useEffect(() => {
    if (originalTracks.length === 0) return;

    // If the track has a suspicious container/tag combination, show the container and tag types columns
    if (originalTracks.some((t) => isTagSuspicious(t.container, t.tagTypes))) {
      setColumnVisibility((prev) => ({
        ...prev,
        container: true,
        tagTypes: true,
      }));
    }
  }, [originalTracks, setColumnVisibility]);

  return {
    columnVisibility,
    setColumnVisibility,
  };
}
