import {
  createColumnHelper,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { type Dispatch, type SetStateAction } from "react";
import type { WebDiscographyRelease } from "~/api/discography";
import {
  convertMusicBrainzReleaseGroupIdToUrl,
  type MusicBrainzAnyName,
} from "~/lib/fetch/musicbrainzUtils";
import { useTableColumnVisibility } from "../table/useTableColumnVisibility";
import { RolesCell, StatusCell } from "./DiscographyReleasesTable";
import { convertVgmdbAlbumIdToUrl } from "~/lib/fetch/vgmdbUtils";
import { getSelectionColumn } from "../table/SelectionColumn";

const columnHelper = createColumnHelper<WebDiscographyRelease>();

const nameHeader = (name: string, language: string) =>
  function NameHeader() {
    return (
      <>
        {name}
        <br />({language})
      </>
    );
  };

const vgmdbNameAccessor = (
  key: string,
  language: string,
  lk1: string,
  lk2: string,
) =>
  columnHelper.accessor(
    (row) => row.vgmdbAlbumNames?.[lk1] || row.vgmdbAlbumNames?.[lk2],
    {
      id: key,
      header: nameHeader("VGMdb", language),
      sortingFn: "alphanumeric",
      cell: (info) => (
        <a
          href={convertVgmdbAlbumIdToUrl(info.row.original.vgmdbAlbumId || 0)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white"
        >
          {info.getValue()}
        </a>
      ),
      size: 300,
      meta: {
        visibility: "showIfExists",
      },
    },
  );

const musicBrainzNameAccessor = (
  key: string,
  language: string,
  langKey1: string,
  langKey2: string,
) =>
  columnHelper.accessor(
    (row) => {
      const names = row.musicbrainzReleaseGroupNames;
      if (!names || names.length === 0) return null;
      const targetName = names.find(
        (n: MusicBrainzAnyName) =>
          "locale" in n && (n.locale === langKey1 || n.locale === langKey2),
      );
      return targetName?.name || null;
    },
    {
      id: key,
      header: nameHeader("MusicBrainz", language),
      sortingFn: "alphanumeric",
      cell: (info) => (
        <a
          href={convertMusicBrainzReleaseGroupIdToUrl(
            info.row.original.musicbrainzReleaseGroupId || "",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white"
        >
          {info.getValue()}
        </a>
      ),
      size: 300,
      meta: {
        visibility: "showIfExists",
      },
    },
  );

export const discographyTableColumns: ColumnDef<WebDiscographyRelease, any>[] =
  [
    getSelectionColumn(columnHelper),

    columnHelper.accessor("releaseDate", {
      id: "releaseDate",
      header: "Release date",
      sortingFn: "alphanumeric",
      size: 120,
      meta: {
        className: "tabular-nums",
      },
    }),

    columnHelper.accessor("catalogNumber", {
      id: "catalogNumber",
      header: "Catalog #",
      sortingFn: "alphanumeric",
      size: 120,
      meta: {
        className: "tabular-nums",
      },
    }),

    // VGMdb names
    vgmdbNameAccessor("vgmdbNameEn", "English", "en", "English"),
    vgmdbNameAccessor("vgmdbNameRomaji", "Romaji", "ja-latn", "Romaji"),
    vgmdbNameAccessor("vgmdbNameJa", "Japanese", "ja", "Japanese"),
    columnHelper.accessor("vgmdbRole", {
      id: "vgmdbRole",
      header: "VGMdb role",
      sortingFn: "alphanumeric",
      size: 200,
      cell: (info) => <RolesCell value={info.getValue()} />,
      meta: {
        visibility: "showIfExists",
      },
    }),

    // MusicBrainz names
    musicBrainzNameAccessor("mbNameEn", "English", "en", "English"),
    musicBrainzNameAccessor("mbNameRomaji", "Romaji", "ja-latn", "Romaji"),
    musicBrainzNameAccessor("mbNameJa", "Japanese", "ja", "Japanese"),

    columnHelper.accessor("status", {
      id: "status",
      header: "Status",
      cell: (info) => <StatusCell value={info.getValue()} id={info.row.id} />,
      sortingFn: "alphanumeric",
      size: 180,
      meta: {
        className: "!px-0 !py-0 flex-col",
      },
    }),
    columnHelper.accessor("path", {
      id: "path",
      header: "Path",
      sortingFn: "alphanumeric",
      size: 200,
    }),
  ];

export interface UseDiscographyTableColumnsReturn {
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
}

export function useDiscographyTableColumns(
  releases: WebDiscographyRelease[],
): UseDiscographyTableColumnsReturn {
  const { columnVisibility, setColumnVisibility } = useTableColumnVisibility(
    discographyTableColumns,
    releases,
  );

  return {
    columnVisibility,
    setColumnVisibility,
  };
}
