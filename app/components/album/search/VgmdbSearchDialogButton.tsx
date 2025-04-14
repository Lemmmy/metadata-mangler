import { useQuery } from "@tanstack/react-query";
import { Globe, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { type VgmdbAlbumSearchResult } from "~/lib/fetch/vgmdb";
import { getPreferredVgmdbName } from "~/lib/fetch/vgmdbUtils";
import { useTRPC } from "~/lib/trpc";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "~/lib/utils";
import { useThrottledValue } from "@tanstack/react-pacer";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { VgmdbHoverCardContents } from "./VgmdbHoverCardContents";

interface Props {
  dirName: string;
  albumName: string;
  onConfirm: (id: string) => void;
}

export const categoryClasses: Record<string, string> = {
  "Doujin/Fanmade": "text-orange-500",
};

export function VgmdbSearchDialogButton({
  dirName,
  albumName,
  onConfirm: rawOnConfirm,
}: Props) {
  const [open, setOpen] = useState(false);

  const onConfirm = (id: string) => {
    rawOnConfirm(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Search VGMdb
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full min-w-[480px] md:max-w-[1024px]">
        <DialogHeader>
          <DialogTitle>Search VGMdb</DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>Search by album name</DialogDescription>
          </VisuallyHidden>

          {/* Actual content here: */}
          <VgmdbSearchDialog
            dirName={dirName}
            albumName={albumName}
            onConfirm={onConfirm}
          />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

function VgmdbSearchDialog({ dirName, albumName, onConfirm }: Props) {
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

function VgmdbSearchResult({
  result,
  onConfirm,
}: {
  result: VgmdbAlbumSearchResult;
  onConfirm: (id: string) => void;
}) {
  const url = `https://vgmdb.net/${result.link}`;
  const id = parseInt(result.link.split("/").pop() || "0");
  const onClick = () => onConfirm(url);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <tr
          className="cursor-pointer items-center gap-1 py-0.5 text-sm hover:bg-zinc-100/10"
          onClick={onClick}
        >
          {/* Catalog number */}
          <td className="rounded-l px-2 tabular-nums">{result.catalog}</td>

          {/* Album name */}
          <td className={cn("px-2", categoryClasses[result.category])}>
            {getPreferredVgmdbName(result.titles)}
          </td>

          {/* Category */}
          <td className="px-2">{result.category}</td>

          {/* Release date */}
          <td className="px-2 tabular-nums">{result.release_date}</td>

          {/* Media format */}
          <td className="px-2">{result.media_format}</td>

          {/* Open in browser button */}
          <td className="rounded-r" width="16">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="sm" className="!px-2">
                <Globe className="h-4 w-4" />
              </Button>
            </a>
          </td>
        </tr>
      </HoverCardTrigger>

      <HoverCardContent className="min-w-[320px]">
        {id && <VgmdbHoverCardContents albumId={id} />}
      </HoverCardContent>
    </HoverCard>
  );
}

function VgmdbSearchResults({
  results,
  onConfirm,
  isLoading,
}: {
  results: VgmdbAlbumSearchResult[];
  onConfirm: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="h-[320px] overflow-y-auto">
      <table className="mt-0.5 w-full">
        <thead>
          <tr className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            <th className="px-2 py-1.5">Catalog</th>
            <th className="px-2 py-1.5">Album</th>
            <th className="px-2 py-1.5">Category</th>
            <th className="px-2 py-1.5">Released</th>
            <th className="px-2 py-1.5">Media</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="h-9 px-2 py-1" colSpan={5}>
                    <div className="bg-muted animate-pulse rounded">&nbsp;</div>
                  </td>
                </tr>
              ))
            : results.map((result) => (
                <VgmdbSearchResult
                  key={result.link}
                  result={result}
                  onConfirm={onConfirm}
                />
              ))}
        </tbody>
      </table>
    </div>
  );
}
