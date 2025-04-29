import {
  createColumnHelper,
  type CellContext,
  type ColumnDef,
  type RowData,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { formatDuration } from "~/lib/duration";
import { isTagSuspicious } from "~/lib/tags/musicMetadataShared";
import {
  useMetadataStore,
  type StoreTrack,
  type StoreTrackUpdatable,
} from "../useMetadataStore";
import { DebugButtons } from "./DebugButtons";
import { EditableCell } from "./EditableCell";
import { Button } from "~/components/ui/button";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    classNameFn?: (ctx: CellContext<TData, TValue>) => string;
    headerExtra?: () => ReactNode;
    hiddenByDefault?: boolean;
  }
}

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
  columnHelper.accessor("filename", {
    header: "Filename",
    id: "filename",
    meta: {
      className: "px-3 py-2 text-xs tabular-nums",
    },
  }),
  columnHelper.accessor("discNumber", {
    header: "Disc #",
    id: "discNumber",
    cell: createEditableCellRenderer("discNumber", "number", 1),
    size: 32,
    enableResizing: false,
    meta: {
      className: "tabular-nums",
    },
  }),
  columnHelper.accessor("trackNumber", {
    header: "Track #",
    id: "trackNumber",
    cell: createEditableCellRenderer("trackNumber", "number", 1),
    size: 32,
    enableResizing: false,
    meta: {
      className: "tabular-nums",
    },
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
  columnHelper.accessor("displayArtist", {
    header: "Display artist",
    id: "displayArtist",
    cell: createEditableCellRenderer("displayArtist"),
    meta: {
      hiddenByDefault: true,
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
    header: "Album",
    id: "album",
    cell: createEditableCellRenderer("album"),
    meta: {
      hiddenByDefault: true,
    },
  }),
  columnHelper.accessor("albumArtist", {
    header: "Album artist",
    id: "albumArtist",
    cell: createEditableCellRenderer("albumArtist"),
    meta: {
      hiddenByDefault: true,
    },
  }),
  columnHelper.accessor("year", {
    header: "Year",
    id: "year",
    cell: createEditableCellRenderer("year"),
    size: 48,
    meta: {
      hiddenByDefault: true,
      className: "tabular-nums",
    },
  }),
  columnHelper.accessor("date", {
    header: "Date",
    id: "date",
    cell: createEditableCellRenderer("date"),
    size: 48,
    meta: {
      hiddenByDefault: true,
      className: "tabular-nums",
    },
  }),
  columnHelper.accessor("grouping", {
    header: "Grouping",
    id: "grouping",
    cell: createEditableCellRenderer("grouping"),
    meta: {
      hiddenByDefault: true,
    },
  }),
  columnHelper.accessor("catalogNumber", {
    header: "Catalog",
    id: "catalogNumber",
    cell: createEditableCellRenderer("catalogNumber"),
    size: 48,
    meta: {
      hiddenByDefault: true,
    },
  }),
  columnHelper.accessor("barcode", {
    header: "Barcode",
    id: "barcode",
    cell: createEditableCellRenderer("barcode"),
    size: 48,
    meta: {
      hiddenByDefault: true,
    },
  }),
  columnHelper.accessor("albumSubtitle", {
    header: "Album subtitle",
    id: "albumSubtitle",
    cell: createEditableCellRenderer("albumSubtitle"),
    meta: {
      hiddenByDefault: true,
    },
  }),
  columnHelper.accessor("trackComment", {
    header: "Track comment",
    id: "trackComment",
    cell: createEditableCellRenderer("trackComment"),
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
      className: "px-3 py-2 tabular-nums",
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
    header: "Tag types",
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
  columnHelper.display({
    header: "Debug",
    id: "debug",
    cell: (ctx) => <DebugButtons track={ctx.row.original} />,
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
      function normalizeTag(tag: any) {
        return Array.isArray(tag) ? [...tag].sort().join(",") : tag;
      }

      // If there's more than one value for album-specific tags, show that tag's column
      function checkTagCardinality(
        tag: keyof StoreTrackUpdatable,
        justExistence: boolean = false,
      ) {
        const uniqueValues = new Set();

        let found = false;
        for (let i = 0; i < originalTracks.length; i++) {
          const value = normalizeTag(originalTracks[i][tag]);
          if (value) {
            if (justExistence) {
              found = true;
              break;
            }

            uniqueValues.add(value);

            if (uniqueValues.size > 1) {
              found = true;
              break;
            }
          }
        }

        if (found) {
          setColumnVisibility((prev) => ({
            ...prev,
            [tag]: true,
          }));
        }
      }

      checkTagCardinality("album");
      checkTagCardinality("albumArtist");
      checkTagCardinality("displayArtist", true);
      checkTagCardinality("year");
      checkTagCardinality("date");
      checkTagCardinality("grouping");
      checkTagCardinality("container");
      checkTagCardinality("catalogNumber");
      checkTagCardinality("barcode");
      checkTagCardinality("albumSubtitle");
      checkTagCardinality("trackComment");
      checkTagCardinality("codec");
      checkTagCardinality("tagTypes");

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
