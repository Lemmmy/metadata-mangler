import {
  useMetadataStore,
  type StoreAlbum,
} from "~/components/album/useMetadataStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "~/lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface Props {
  album: StoreAlbum | null;
}

export function AlbumInformationSection({ album }: Props) {
  const {
    originalAlbum,
    updateAlbumName,
    updateAlbumArtist,
    isNameUpdated,
    isArtistUpdated,
  } = useMetadataStore(
    useShallow((s) => ({
      originalAlbum: s.originalAlbum,
      updateAlbumName: s.updateAlbumName,
      updateAlbumArtist: s.updateAlbumArtist,
      isNameUpdated: s.originalAlbum?.name !== s.album?.name,
      isArtistUpdated: s.originalAlbum?.artist !== s.album?.artist,
    })),
  );

  return (
    <div>
      <h2 className="text-xl font-semibold">Album information</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Album name */}
        <div className="grid w-full gap-1.5">
          <Label htmlFor="albumName">Album name</Label>
          <div className="relative mb-4">
            <Input
              type="text"
              className={cn(
                isNameUpdated && "bg-lime-600/20 dark:bg-lime-600/20",
              )}
              value={album?.name || ""}
              onChange={(e) => updateAlbumName(e.target.value)}
            />
            {isNameUpdated && originalAlbum?.name && (
              <p className="text-muted-foreground absolute -bottom-6 mt-1 px-3 text-xs">
                {originalAlbum.name}
              </p>
            )}
          </div>
        </div>

        {/* Album artist */}
        <div className="grid w-full gap-1.5">
          <Label htmlFor="albumArtist">Album artist</Label>
          <div className="relative mb-4">
            <Input
              type="text"
              className={cn(
                isArtistUpdated && "bg-lime-600/20 dark:bg-lime-600/20",
              )}
              value={album?.artist || ""}
              onChange={(e) => updateAlbumArtist(e.target.value)}
            />
            {isArtistUpdated && originalAlbum?.artist && (
              <p className="text-muted-foreground absolute -bottom-6 mt-1 px-3 text-xs">
                {originalAlbum.artist}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
