import { File, Folder, Music } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router";

export interface DirectoryListEntry {
  name: string;
  isDirectory: boolean;
  isSupportedMusicFile: boolean;
}

interface Props {
  entries: DirectoryListEntry[];
}

export function DirectoryList({ entries }: Props): ReactElement {
  return (
    <ul className="list-none">
      {entries.map((item) => (
        <DirectoryListItem key={item.name} item={item} />
      ))}
    </ul>
  );
}

function DirectoryListItem({ item }: { item: DirectoryListEntry }) {
  return (
    <li>
      <Link
        to={`/browse/${item.name}`}
        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-zinc-100/10"
      >
        <DirectoryListItemIcon item={item} />
        <span>{item.name}</span>
      </Link>
    </li>
  );
}

const iconClass = "block h-4 w-4 flex-shrink-0 text-zinc-500";

function DirectoryListItemIcon({ item }: { item: DirectoryListEntry }) {
  if (item.isDirectory) return <Folder className={iconClass} />;
  if (item.isSupportedMusicFile) return <Music className={iconClass} />;
  return <File className={iconClass} />;
}
