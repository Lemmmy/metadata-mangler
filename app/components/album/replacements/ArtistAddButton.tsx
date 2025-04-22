import { useThrottledValue } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useTRPC } from "~/lib/trpc";
import { useMetadataStore } from "../useMetadataStore";

type ArtistAddMode = "prepend" | "append";

export function ArtistAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle />
          Add artist
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {open && <ArtistAddPopover setOpen={setOpen} />}
      </PopoverContent>
    </Popover>
  );
}

function ArtistAddPopover({
  setOpen,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  "use no memo";

  const [commandOpen, setCommandOpen] = useState(true);
  const [mode, setMode] = useState<ArtistAddMode>("prepend");
  const [artist, setArtist] = useState("");
  const [throttledArtist] = useThrottledValue(artist, {
    wait: 500,
    leading: true,
  });

  // Get all existing artists from the album and tracks
  const { album, tracks } = useMetadataStore(
    useShallow((s) => ({
      album: s.album,
      tracks: s.tracks,
    })),
  );

  // Extract all unique artists from the album and tracks
  const existingArtists = useMemo(() => {
    const artists = new Set<string>();

    // Add album artist if it exists
    if (album?.artist) {
      artists.add(album.artist);
    }

    // Add all track artists
    for (const track of tracks) {
      if (track.artists) {
        track.artists.split(/;\s*/).forEach((a) => artists.add(a.trim()));
      }
    }

    return Array.from(artists).sort();
  }, [album, tracks]);

  // Get artist autocompletions from the API
  const trpc = useTRPC();
  const { data: autocompletions } = useQuery(
    trpc.replacements.getArtistAutocompletions.queryOptions(
      { query: throttledArtist },
      {
        enabled: !!throttledArtist && throttledArtist.length > 1,
      },
    ),
  );

  // Combine existing artists and autocompletions
  const suggestions = useMemo(() => {
    const allSuggestions = new Set<string>([
      ...existingArtists,
      ...(autocompletions?.success ? autocompletions.results : []),
    ]);
    return Array.from(allSuggestions)
      .filter((a) => a.toLowerCase().includes(throttledArtist.toLowerCase()))
      .sort();
  }, [existingArtists, autocompletions, throttledArtist]);

  const handleAddArtist = useCallback(() => {
    if (!artist.trim()) return;

    // Update the metadata store
    const state = useMetadataStore.getState();
    for (let i = 0; i < state.tracks.length; i++) {
      const track = state.tracks[i];
      const artists = track.artists.split(/;\s*/).map((a) => a.trim());
      const trimmedArtist = artist.trim();

      // Skip if the artist already exists in the list
      if (artists.includes(trimmedArtist)) {
        continue;
      }

      // Add the artist at the beginning or end based on mode
      let newArtists: string[];
      if (mode === "prepend") {
        newArtists = [trimmedArtist, ...artists];
      } else {
        newArtists = [...artists, trimmedArtist];
      }

      state.updateTrack(i, "artists", newArtists.join("; "));
    }

    // Reset and close
    setArtist("");
    setOpen(false);
  }, [artist, mode, setOpen]);

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="leading-none font-medium">Add artist to all tracks</h4>
        <p className="text-muted-foreground text-sm">
          Add an artist to all tracks in the album.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode">Position</Label>
        <RadioGroup
          id="mode"
          value={mode}
          onValueChange={(value) => setMode(value as ArtistAddMode)}
          className="flex"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="prepend" id="prepend" />
            <Label htmlFor="prepend">Prepend</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="append" id="append" />
            <Label htmlFor="append">Append</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="artist">Artist</Label>
        <Popover open={commandOpen} onOpenChange={setCommandOpen}>
          <Command>
            <PopoverTrigger asChild>
              <div>
                <Input
                  placeholder="Search artists..."
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  autoFocus
                />
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              align="start"
            >
              <CommandList>
                <CommandEmpty>No artists found.</CommandEmpty>
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={(value) => {
                        setArtist(value);
                        setCommandOpen(false);
                      }}
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </PopoverContent>
          </Command>
        </Popover>
      </div>

      <Button onClick={handleAddArtist} disabled={!artist.trim()}>
        Add
      </Button>
    </div>
  );
}
