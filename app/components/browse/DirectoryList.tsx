import { File, Folder, Music } from "lucide-react";
import type { ReactElement } from "react";
import { NavLink } from "react-router";
import { useDirectorySearch } from "./useDirectorySearch";
import { OpenAsAlbum } from "./OpenAsAlbum";

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
      <div className="h-full overflow-y-auto">
        <ul className="list-none">
          {results.map((item) => (
            <DirectoryListItem
              key={item.name}
              item={item}
              basePath={basePath}
            />
          ))}
        </ul>
      </div>
    </>
  );
}

function DirectoryListItem({
  item,
  basePath,
}: {
  item: DirectoryListEntry;
  basePath: string;
}) {
  return (
    <li className="flex items-center gap-1 py-0.5 tabular-nums">
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
    </li>
  );
}

const iconClass = "block h-4 w-4 flex-shrink-0 text-zinc-500";

function DirectoryListItemIcon({ item }: { item: DirectoryListEntry }) {
  if (item.isDirectory) return <Folder className={iconClass} />;
  if (item.isSupportedMusicFile) return <Music className={iconClass} />;
  return <File className={iconClass} />;
}
