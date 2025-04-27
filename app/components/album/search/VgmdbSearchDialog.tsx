import { useThrottledValue } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { parseCatalogNumber } from "~/lib/fetch/metadataUtils";
import type { VgmdbAlbumSearchResult } from "~/lib/fetch/vgmdb";
import { useTRPC } from "~/lib/trpc";
import { VgmdbSearchResults } from "./VgmdbSearchResults";

export interface VgmdbSearchDialogProps {
  albumName: string;
  dirName: string;
  catalogNumberTag: string;
  onConfirm: (id: string) => void;
}

export interface ProcessedVgmdbAlbumSearchResult
  extends VgmdbAlbumSearchResult {
  catalogNumberMatched: boolean;
}

export function VgmdbSearchDialog({
  albumName,
  dirName,
  catalogNumberTag,
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
  const catalogNumbers = useMemo(() => {
    return new Set([
      ...parseCatalogNumber(dirName),
      ...parseCatalogNumber(catalogNumberTag),
    ]);
  }, [dirName, catalogNumberTag]);

  const sortedResults = useMemo(() => {
    if (!albums) return [];

    const out: ProcessedVgmdbAlbumSearchResult[] = [];

    for (const result of albums) {
      const catalogNumberMatched =
        !!result.catalog && catalogNumbers.has(result.catalog);

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
  }, [albums, catalogNumbers]);

  return (
    <>
      {/* Search box & refresh button */}
      <VgmdbSearchControls
        search={search}
        setSearch={setSearch}
        dirName={dirName}
        catalogNumbers={catalogNumbers}
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
  catalogNumbers,
  albumName,
  onRefresh,
  isPending,
}: {
  search: string;
  setSearch: (search: string) => void;
  dirName: string;
  catalogNumbers: Set<string>;
  albumName: string;
  onRefresh: () => void;
  isPending: boolean;
}) {
  return (
    <div className="mt-2 flex items-center gap-1">
      {/* Search box */}
      <Input value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Query shortcuts */}
      {catalogNumbers.size > 0 &&
        (catalogNumbers.size > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Catalog</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Array.from(catalogNumbers).map((catalogNumber) => (
                <DropdownMenuItem
                  key={catalogNumber}
                  onClick={() => setSearch(catalogNumber)}
                >
                  {catalogNumber}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setSearch(Array.from(catalogNumbers)[0])}
          >
            {Array.from(catalogNumbers)[0]}
          </Button>
        ))}
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
        <RefreshCw />
      </Button>
    </div>
  );
}
