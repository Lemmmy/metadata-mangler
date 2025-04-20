import { useThrottledValue } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useTRPC } from "~/lib/trpc";
import { VgmdbSearchResults } from "./VgmdbSearchResults";

export interface VgmdbSearchDialogProps {
  dirName: string;
  albumName: string;
  onConfirm: (id: string) => void;
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
        results={searchQuery.data?.results?.albums || []}
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
