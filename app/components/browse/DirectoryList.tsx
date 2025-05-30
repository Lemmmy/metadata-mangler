import { File, Folder, Music, SortAsc, SortDesc } from "lucide-react";
import type { HTMLProps, ReactElement } from "react";
import { NavLink } from "react-router";
import {
  sortByNames,
  useDirectorySearch,
  type SortType,
} from "./useDirectorySearch";
import { OpenAsAlbum } from "./OpenAsAlbum";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "~/lib/utils";
import type { Dayjs } from "dayjs";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export interface DirectoryListEntry {
  name: string;
  isDirectory: boolean;
  isSupportedMusicFile: boolean;
  mtime: string | null;
}

export interface ProcessedDirectoryListEntry
  extends Omit<DirectoryListEntry, "mtime"> {
  mtime: Dayjs | null;
}

interface Props {
  entries: DirectoryListEntry[];
  basePath: string;
}

export default function DirectoryList({
  entries,
  basePath,
}: Props): ReactElement {
  const [sort, setSort] = useLocalStorage<SortType>("browseSort", "name_asc");
  const { results, searchBox } = useDirectorySearch(entries, sort);

  return (
    <>
      {/* Top bar - filtering and open as album button */}
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 md:gap-y-2">
        {/* Search box */}
        <div className="max-w-[360px] flex-1">{searchBox}</div>

        {/* Open as album button */}
        {basePath && (
          <OpenAsAlbum directory={basePath}>Open as album</OpenAsAlbum>
        )}

        {/* Sort selector */}
        <div className="flex-1" />
        <DirectoryListSortSelector sort={sort} setSort={setSort} />
      </div>

      {/* Directory list */}
      <DirectoryListInner entries={results} basePath={basePath} />
    </>
  );
}

function DirectoryListInner({
  entries,
  basePath,
}: {
  entries: ProcessedDirectoryListEntry[];
  basePath: string;
}) {
  // eslint-disable-next-line react-compiler/react-compiler
  "use no memo";

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 6,
  });

  return (
    <div ref={parentRef} className="relative h-full max-h-full overflow-y-auto">
      <div
        className="relative m-0 p-0"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = entries[virtualRow.index];
          return (
            <DirectoryListItem
              key={item.name}
              item={item}
              basePath={basePath}
              className="absolute top-0 left-0 h-[36px] w-full truncate"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function DirectoryListItem({
  item,
  basePath,
  className,
  ...props
}: {
  item: ProcessedDirectoryListEntry;
  basePath: string;
  className?: string;
} & HTMLProps<HTMLDivElement>) {
  const encodedBasePath = basePath
    ? basePath.split("/").map(encodeURIComponent).join("/")
    : "";
  const encodedItemName = item.name
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return (
    <div
      {...props}
      className={cn("flex items-center gap-1 py-0.5 tabular-nums", className)}
    >
      {/* Open as album button */}
      {item.isDirectory && (
        <OpenAsAlbum
          directory={basePath ? `${basePath}/${item.name}` : item.name}
          size="sm"
        />
      )}

      {/* Directory or file icon + name */}
      <NavLink
        to={
          item.isDirectory
            ? `${encodedBasePath ? `/browse/${encodedBasePath}` : "/browse"}/${encodedItemName}`
            : "#"
        }
        end
        className="flex flex-1 items-center gap-2 rounded px-1 py-1 hover:bg-zinc-100/10 [&.pending]:animate-pulse"
      >
        {/* Icon & name */}
        <DirectoryListItemIcon item={item} />
        <span>{item.name}</span>

        {/* Spacer & modified time on right */}
        <div className="flex-1" />
        {item.mtime && (
          <span className="text-muted-foreground text-xs">
            {item.mtime.format("YYYY-MM-DD HH:mm")}
          </span>
        )}
      </NavLink>
    </div>
  );
}

const iconClass = "block h-4 w-4 flex-shrink-0 text-zinc-500";

function DirectoryListItemIcon({
  item,
}: {
  item: ProcessedDirectoryListEntry;
}) {
  if (item.isDirectory) return <Folder className={iconClass} />;
  if (item.isSupportedMusicFile) return <Music className={iconClass} />;
  return <File className={iconClass} />;
}

function DirectoryListSortSelector({
  sort,
  setSort,
}: {
  sort: SortType;
  setSort: (sort: SortType) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">
          {sort?.endsWith("desc") ? <SortDesc /> : <SortAsc />}
          {sortByNames[sort]}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {Object.entries(sortByNames).map(([key, name]) => (
          <DropdownMenuItem key={key} onClick={() => setSort(key as SortType)}>
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
