import { Globe } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { MusicBrainzReleaseResult } from "~/lib/fetch/musicbrainz";
import { cn } from "~/lib/utils";

interface Props {
  results: MusicBrainzReleaseResult[];
  onConfirm: (id: string) => void;
  isLoading: boolean;
  searchType: "release" | "track";
}

export function MusicBrainzSearchResults({
  results,
  onConfirm,
  isLoading,
  searchType,
}: Props) {
  const headerCellClass =
    "text-muted-foreground text-xs font-medium tracking-wider uppercase px-2 py-1.5";

  // Determine columns based on search type
  const showTrackColumn = searchType === "track";

  return (
    <div className="mt-4 h-[390px] overflow-y-auto">
      <div
        className={cn(
          "mt-0.5 grid w-full",
          showTrackColumn
            ? "grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto_32px]"
            : "grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto_auto_32px]",
        )}
      >
        <div className={headerCellClass}>Catalog</div>
        <div className={headerCellClass}>Album</div>
        <div className={headerCellClass}>Artist</div>
        {showTrackColumn && <div className={headerCellClass}>Track</div>}
        <div className={headerCellClass}>Media</div>
        <div className={cn(headerCellClass, "text-right")}>Released</div>
        <div>{/* Dummy cell for open button header */}</div>

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "col-span-7 h-9 px-2 py-1",
                !showTrackColumn && "col-span-6",
              )}
            >
              <div className="bg-muted animate-pulse rounded">&nbsp;</div>
            </div>
          ))
        ) : results.length === 0 ? (
          <div
            className={cn(
              "text-muted-foreground col-span-7 px-2 py-4 text-center",
              !showTrackColumn && "col-span-6",
            )}
          >
            No results found. Try a different search query.
          </div>
        ) : (
          results.map((result) => (
            <MusicBrainzSearchResult
              key={result.id}
              result={result}
              onConfirm={onConfirm}
              showTrackColumn={showTrackColumn}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MusicBrainzSearchResult({
  result,
  onConfirm,
  showTrackColumn,
}: {
  result: MusicBrainzReleaseResult;
  onConfirm: (url: string) => void;
  showTrackColumn: boolean;
}) {
  const onClick = () =>
    onConfirm(`https://musicbrainz.org/release/${result.id}`);

  function Cell({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <div
        className={cn(
          "h-[36px] cursor-pointer rounded py-0.5 align-middle text-sm leading-[36px] hover:bg-zinc-100/10",
          className,
        )}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      {/* Catalog number */}
      <Cell className="px-2 whitespace-nowrap tabular-nums">
        {result.catalog}
      </Cell>

      {/* Album name */}
      <Cell className="max-w-full truncate px-2">{result.title}</Cell>

      {/* Artist */}
      <Cell className="max-w-full truncate px-2">{result.artist}</Cell>

      {/* Track title (only shown when searching by track) */}
      {showTrackColumn && (
        <Cell className="max-w-full truncate px-2">{result.trackTitle}</Cell>
      )}

      {/* Media format */}
      <Cell className="px-2 whitespace-nowrap">{result.format}</Cell>

      {/* Release date with country flag */}
      <Cell className="px-2 text-right whitespace-nowrap tabular-nums">
        {/* This would normally include a country flag */}
        {result.country} {result.date}
      </Cell>

      {/* Open in browser button */}
      <Cell>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="sm" className="!px-2">
            <Globe />
          </Button>
        </a>
      </Cell>
    </>
  );
}
