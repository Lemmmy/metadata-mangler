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
  "Doujin/Fanmade": "text-orange-500 dark:text-orange-400",
  Bootleg: "text-red-500 dark:text-red-400",
  Game: "text-sky-500 dark:text-sky-300",
  Animation: "text-lime-500 dark:text-lime-400",
  "Other Works": "text-blue-500",
  "Enclosure/Promo": "text-yellow-500 dark:text-yellow-300",
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

function VgmdbSearchResults({
  results,
  onConfirm,
  isLoading,
}: {
  results: VgmdbAlbumSearchResult[];
  onConfirm: (id: string) => void;
  isLoading: boolean;
}) {
  const headerCellClass =
    "text-muted-foreground text-xs font-medium tracking-wider uppercase px-2 py-1.5";

  return (
    <div className="h-[390px] overflow-y-auto">
      <div className="mt-0.5 grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto_32px]">
        <div className={headerCellClass}>Catalog</div>
        <div className={headerCellClass}>Album</div>
        <div className={cn(headerCellClass, "text-right")}>Media</div>
        <div className={cn(headerCellClass, "text-right")}>Released</div>
        <div>{/* Dummy cell for open button header */}</div>

        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="col-span-5 h-9 px-2 py-1">
                <div className="bg-muted animate-pulse rounded">&nbsp;</div>
              </div>
            ))
          : results.map((result) => (
              <VgmdbSearchResult
                key={result.link}
                result={result}
                onConfirm={onConfirm}
              />
            ))}
      </div>
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

  const hoverCardContent = (
    <HoverCardContent className="min-w-[480px]">
      {id && <VgmdbHoverCardContents albumId={id} />}
    </HoverCardContent>
  );

  function Cell({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div
            className={cn(
              "h-[36px] cursor-pointer rounded py-0.5 align-middle text-sm leading-[36px] hover:bg-zinc-100/10",
              className,
            )}
            onClick={onClick}
          >
            {children}
          </div>
        </HoverCardTrigger>
        {hoverCardContent}
      </HoverCard>
    );
  }

  return (
    <>
      {/* Catalog number */}
      <Cell className="px-2 whitespace-nowrap tabular-nums">
        {result.catalog}
      </Cell>

      {/* Album name */}
      <Cell
        className={cn(
          "max-w-full truncate px-2",
          categoryClasses[result.category],
        )}
      >
        {getPreferredVgmdbName(result.titles)}
      </Cell>

      {/* Media format */}
      <Cell className="px-2 text-right whitespace-nowrap">
        {result.media_format}
      </Cell>

      {/* Release date */}
      <Cell className="px-2 text-right whitespace-nowrap tabular-nums">
        {result.release_date}
      </Cell>

      {/* Open in browser button */}
      <Cell>
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
      </Cell>
    </>
  );
}
