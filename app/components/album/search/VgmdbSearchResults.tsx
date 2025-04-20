import { Globe } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { getPreferredVgmdbName } from "~/lib/fetch/vgmdbUtils";
import { cn } from "~/lib/utils";
import { VgmdbHoverCardContents } from "./VgmdbHoverCardContents";
import type { ProcessedVgmdbAlbumSearchResult } from "./VgmdbSearchDialog";

export const categoryClasses: Record<string, string> = {
  "Doujin/Fanmade": "text-orange-500 dark:text-orange-400",
  Bootleg: "text-red-500 dark:text-red-400",
  Game: "text-sky-500 dark:text-sky-300",
  Animation: "text-lime-500 dark:text-lime-400",
  "Other Works": "text-blue-500",
  "Enclosure/Promo": "text-yellow-500 dark:text-yellow-300",
};

interface Props {
  results: ProcessedVgmdbAlbumSearchResult[];
  onConfirm: (id: string) => void;
  isLoading: boolean;
}

export function VgmdbSearchResults({ results, onConfirm, isLoading }: Props) {
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
  result: ProcessedVgmdbAlbumSearchResult;
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
      <Cell
        className={cn(
          "px-2 whitespace-nowrap tabular-nums",
          result.catalogNumberMatched && "text-primary font-semibold",
        )}
      >
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
            <Globe />
          </Button>
        </a>
      </Cell>
    </>
  );
}
