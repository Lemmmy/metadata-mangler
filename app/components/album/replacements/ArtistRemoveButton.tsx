import { MinusCircle } from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useMetadataStore } from "../useMetadataStore";
import {
  fromSemicolonString,
  toSemicolonString,
} from "~/lib/tags/musicMetadataShared";

export function ArtistRemoveButton() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <MinusCircle />
          Remove artist
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {open && <ArtistRemovePopover setOpen={setOpen} />}
      </PopoverContent>
    </Popover>
  );
}

function ArtistRemovePopover({
  setOpen,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  "use no memo";

  const [selectedArtist, setSelectedArtist] = useState("");

  // Get all existing artists from the tracks only
  const { tracks } = useMetadataStore(
    useShallow((s) => ({
      tracks: s.tracks,
    })),
  );

  // Extract all unique artists from the tracks
  const trackArtists = useMemo(() => {
    const artists = new Set<string>();

    // Add all track artists
    for (const track of tracks) {
      if (track.artists) {
        fromSemicolonString(track.artists).forEach((a) =>
          artists.add(a.trim()),
        );
      }
    }

    return Array.from(artists).sort();
  }, [tracks]);

  const handleRemoveArtist = useCallback(() => {
    if (!selectedArtist) return;

    // Update the metadata store
    const state = useMetadataStore.getState();
    for (let i = 0; i < state.tracks.length; i++) {
      const track = state.tracks[i];
      const artists = fromSemicolonString(track.artists);

      // Skip if the artist doesn't exist in the list
      if (!artists.includes(selectedArtist)) {
        continue;
      }

      // Remove the artist from the list
      const newArtists = artists.filter((a) => a !== selectedArtist);
      state.updateTrack(i, "artists", toSemicolonString(newArtists));
    }

    // Reset and close
    setSelectedArtist("");
    setOpen(false);
  }, [selectedArtist, setOpen]);

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="leading-none font-medium">
          Remove artist from all tracks
        </h4>
        <p className="text-muted-foreground text-sm">
          Remove an artist from all tracks in the album.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="artist">Artist</Label>
        <Select value={selectedArtist} onValueChange={setSelectedArtist}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select artist to remove" />
          </SelectTrigger>
          <SelectContent>
            {trackArtists.map((artist) => (
              <SelectItem key={artist} value={artist}>
                {artist}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleRemoveArtist}
        disabled={!selectedArtist}
        variant="destructive"
      >
        Remove
      </Button>
    </div>
  );
}
