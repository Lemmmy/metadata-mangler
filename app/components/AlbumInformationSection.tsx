import {
  useMetadataStore,
  type StoreAlbum,
} from "~/components/useMetadataStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "~/lib/utils";

interface Props {
  album: StoreAlbum | null;
}

export function AlbumInformationSection({ album }: Props) {
  const { originalAlbum, updateAlbumName, updateAlbumArtist } =
    useMetadataStore(
      useShallow((s) => ({
        originalAlbum: s.originalAlbum,
        updateAlbumName: s.updateAlbumName,
        updateAlbumArtist: s.updateAlbumArtist,
      })),
    );

  // Check if values are updated compared to original
  const isNameUpdated = useMetadataStore(
    useShallow((s) => s.originalAlbum?.name !== s.album?.name),
  );

  const isArtistUpdated = useMetadataStore(
    useShallow((s) => s.originalAlbum?.artist !== s.album?.artist),
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAlbumName(e.target.value);
  };

  const handleArtistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAlbumArtist(e.target.value);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Album Information</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-muted-foreground block text-sm font-medium">
            Album Name
          </label>
          <div className="relative mb-4">
            <input
              type="text"
              className={cn(
                "border-border w-full rounded-md border px-3 py-2",
                "focus:ring-none focus:outline-2 focus:outline-white/50",
                isNameUpdated && "bg-lime-600/20",
              )}
              value={album?.name || ""}
              onChange={handleNameChange}
            />
            {isNameUpdated && originalAlbum?.name && (
              <div className="absolute -bottom-6 mt-1 px-3 text-xs text-white/50">
                {originalAlbum.name}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block text-sm font-medium">
            Album Artist
          </label>
          <div className="relative mb-4">
            <input
              type="text"
              className={cn(
                "border-border w-full rounded-md border px-3 py-2",
                "focus:ring-none focus:outline-2 focus:outline-white/50",
                isArtistUpdated && "bg-lime-600/20",
              )}
              value={album?.artist || ""}
              onChange={handleArtistChange}
            />
            {isArtistUpdated && originalAlbum?.artist && (
              <div className="absolute -bottom-6 mt-1 px-3 text-xs text-white/50">
                {originalAlbum.artist}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
