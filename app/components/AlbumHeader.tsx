import { AlbumSaveButton } from "./AlbumSaveButton";
import type { StoreAlbum } from "./useMetadataStore";

interface Props {
  album: StoreAlbum | null;
}

export function AlbumHeader({ album }: Props) {
  return (
    <div className="border-b-border -mx-4 -mt-4 mb-4 flex items-center border-b px-4 py-3">
      {/* Will eventually contain a directory up button, the album path, etc. But for now, just the save button */}
      <span className="text-muted-foreground text-xs">{album?.directory}</span>

      <div className="flex-1" />

      <AlbumSaveButton album={album} />
    </div>
  );
}
