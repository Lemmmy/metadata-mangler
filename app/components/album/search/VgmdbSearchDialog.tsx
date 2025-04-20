import { useThrottledValue } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useTRPC } from "~/lib/trpc";
import { VgmdbSearchResults } from "./VgmdbSearchResults";
import { parseCatalogNumber } from "~/lib/fetch/vgmdbUtils";
import type { VgmdbAlbumSearchResult } from "~/lib/fetch/vgmdb";

export interface VgmdbSearchDialogProps {
  dirName: string;
  albumName: string;
  onConfirm: (id: string) => void;
}

export interface ProcessedVgmdbAlbumSearchResult
  extends VgmdbAlbumSearchResult {
  catalogNumberMatched: boolean;
}

export function VgmdbSearchDialog({
  dirName,
  albumName,
  onConfirm,
}: VgmdbSearchDialogProps) {
  const [search, setSearch] = useState(albumName);
  const [throttledSearch] = useThrottledValue(search, {
    wait: 1000,
    leading: true,
  });

  const trpc = useTRPC();
  const searchQuery = useQuery(
    trpc.search.vgmdb.queryOptions(
      { albumName: throttledSearch },
      {
        enabled: !!throttledSearch,
      },
    ),
  );

  useEffect(() => {
    setSearch(albumName);
  }, [albumName]);

  const albums = searchQuery.data?.results?.albums;
  const catalogNumber = parseCatalogNumber(dirName);
  const sortedResults = useMemo(() => {
    if (!albums) return [];

    const out: ProcessedVgmdbAlbumSearchResult[] = [];

    for (const result of albums) {
      const catalogNumberMatched = result.catalog === catalogNumber;
      if (catalogNumberMatched) {
        // If there's a catalog number match in the results, it should be pushed to the top of the list.
        out.unshift({
          ...result,
          catalogNumberMatched,
        });
      } else {
        out.push({
          ...result,
          catalogNumberMatched,
        });
      }
    }

    return out;
  }, [albums, catalogNumber]);

  return (
    <>
      {/* Search box & refresh button */}
      <VgmdbSearchControls
        search={search}
        setSearch={setSearch}
        dirName={dirName}
        albumName={albumName}
        onRefresh={() => searchQuery.refetch()}
        isPending={searchQuery.isPending}
      />

      {/* Error message */}
      {searchQuery.error && (
        <div className="text-red-500">
          {searchQuery.error instanceof Error
            ? searchQuery.error.message
            : String(searchQuery.error)}
        </div>
      )}

      {/* Search results */}
      <VgmdbSearchResults
        results={sortedResults}
        onConfirm={onConfirm}
        isLoading={searchQuery.isLoading}
      />
    </>
  );
}

function VgmdbSearchControls({
  search,
  setSearch,
  dirName,
  albumName,
  onRefresh,
  isPending,
}: {
  search: string;
  setSearch: (search: string) => void;
  dirName: string;
  albumName: string;
  onRefresh: () => void;
  isPending: boolean;
}) {
  return (
    <div className="mt-2 flex items-center gap-1">
      {/* Search box */}
      <Input value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Query shortcuts */}
      {dirName && (
        <Button variant="secondary" onClick={() => setSearch(dirName)}>
          Dir
        </Button>
      )}
      {albumName && (
        <Button variant="secondary" onClick={() => setSearch(albumName)}>
          Album
        </Button>
      )}

      {/* Refresh */}
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isPending}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
