import { File, Folder, Music } from "lucide-react";
import type { HTMLProps, ReactElement } from "react";
import { NavLink } from "react-router";
import { useDirectorySearch } from "./useDirectorySearch";
import { OpenAsAlbum } from "./OpenAsAlbum";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "~/lib/utils";

export interface DirectoryListEntry {
  name: string;
  isDirectory: boolean;
  isSupportedMusicFile: boolean;
}

interface Props {
  entries: DirectoryListEntry[];
  basePath: string;
}

export default function DirectoryList({
  entries,
  basePath,
}: Props): ReactElement {
  const { results, searchBox } = useDirectorySearch(entries);
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
      </div>

      {/* Directory list */}
      <DirectoryListInner entries={results} basePath={basePath} />
    </>
  );
}

function DirectoryListInner({ entries, basePath }: Props) {
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
  item: DirectoryListEntry;
  basePath: string;
  className?: string;
} & HTMLProps<HTMLDivElement>) {
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
            ? `${basePath ? `/browse/${basePath}` : "/browse"}/${item.name}`
            : "#"
        }
        end
        className="flex flex-1 items-center gap-2 rounded px-1 py-1 hover:bg-zinc-100/10 [&.pending]:animate-pulse"
      >
        <DirectoryListItemIcon item={item} />
        <span>{item.name}</span>
      </NavLink>
    </div>
  );
}

const iconClass = "block h-4 w-4 flex-shrink-0 text-zinc-500";

function DirectoryListItemIcon({ item }: { item: DirectoryListEntry }) {
  if (item.isDirectory) return <Folder className={iconClass} />;
  if (item.isSupportedMusicFile) return <Music className={iconClass} />;
  return <File className={iconClass} />;
}
