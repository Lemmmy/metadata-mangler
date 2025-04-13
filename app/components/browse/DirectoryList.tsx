import { File, Folder, Music } from "lucide-react";
import type { ReactElement } from "react";
import { NavLink } from "react-router";
import { useDirectorySearch } from "./useDirectorySearch";

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
      <div className="mb-2 max-w-[360px]">{searchBox}</div>

      <ul className="list-none">
        {results.map((item) => (
          <DirectoryListItem key={item.name} item={item} basePath={basePath} />
        ))}
      </ul>
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
    <li>
      <NavLink
        to={item.isDirectory ? `${basePath}/${item.name}` : "#"}
        end
        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-zinc-100/10 [&.pending]:animate-pulse"
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
