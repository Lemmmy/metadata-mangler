import { useThrottledValue } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useTRPCClient } from "~/lib/trpc";
import { MusicBrainzSearchResults } from "./MusicBrainzSearchResults";

export interface MusicBrainzSearchDialogProps {
  dirName: string;
  albumName: string;
  albumArtist: string;
  tracks: { title: string }[];
  onConfirm: (id: string) => void;
}

type SearchType =
  | { type: "release"; query: string; custom?: boolean }
  | { type: "track"; query: string; custom?: boolean };

export function MusicBrainzSearchDialog({
  dirName,
  albumName,
  albumArtist,
  tracks,
  onConfirm,
}: MusicBrainzSearchDialogProps) {
  // Search type selection state
  const [searchType, setSearchType] = useState<SearchType>({
    type: "release",
    query: albumName,
  });

  // Custom search input state for when "Custom" is selected
  const [customSearch, setCustomSearch] = useState("");

  // Artist filter state
  const [artistFilter, setArtistFilter] = useState(albumArtist);

  // Track options for the select dropdown
  const trackOptions = useMemo(() => {
    // Deduplicate track titles
    const uniqueTitles = Array.from(new Set(tracks.map((t) => t.title)));
    return uniqueTitles;
  }, [tracks]);

  // Whether to show the custom search input
  const showCustomInput = searchType.custom;

  // The actual query to use for searching
  const query = useMemo(() => {
    if (searchType.custom) {
      return customSearch;
    }
    return searchType.query;
  }, [searchType, customSearch]);

  // Throttle the search to avoid excessive API calls
  const [throttledQuery] = useThrottledValue(query, {
    wait: 1000,
    leading: true,
  });

  // Throttle the artist filter to avoid excessive API calls
  const [throttledArtistFilter] = useThrottledValue(artistFilter, {
    wait: 1000,
    leading: true,
  });

  // Set up tRPC client
  const trpcClient = useTRPCClient();

  // Perform the search query based on search type
  const searchQuery = useQuery({
    queryKey: [
      "musicbrainz",
      searchType.type,
      throttledQuery,
      throttledArtistFilter,
    ],
    queryFn: async () => {
      if (searchType.type === "release") {
        return await trpcClient.search.musicBrainzReleases.query({
          query: throttledQuery,
          artistFilter: throttledArtistFilter,
        });
      } else {
        return await trpcClient.search.musicBrainzRecordings.query({
          query: throttledQuery,
          artistFilter: throttledArtistFilter,
        });
      }
    },
    enabled: !!throttledQuery,
  });

  // Handle search type change
  const handleSearchTypeChange = (value: string) => {
    // Parse the value to determine search type and query
    if (value.startsWith("release:")) {
      if (value === "release:custom") {
        setSearchType({ type: "release", query: "", custom: true });
      } else if (value === "release:album") {
        setSearchType({ type: "release", query: albumName });
      } else if (value === "release:directory") {
        setSearchType({ type: "release", query: dirName });
      }
    } else if (value.startsWith("track:")) {
      if (value === "track:custom") {
        setSearchType({ type: "track", query: "", custom: true });
      } else {
        // Extract track title from the value (e.g., "track:Song Title" -> "Song Title")
        const trackTitle = value.substring(6);
        setSearchType({ type: "track", query: trackTitle });
      }
    }
  };

  return (
    <>
      {/* Search controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          <Label htmlFor="search-type">Search type:</Label>
          <Select
            onValueChange={handleSearchTypeChange}
            defaultValue={`release:album`}
          >
            <SelectTrigger id="search-type" className="w-full">
              <SelectValue placeholder="Select search type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="release:album">
                Release: {albumName}
              </SelectItem>
              <SelectItem value="release:directory">
                Release: {dirName}
              </SelectItem>
              <SelectItem value="release:custom">Release: Custom</SelectItem>

              {trackOptions.map((track) => (
                <SelectItem key={track} value={`track:${track}`}>
                  Track: {track}
                </SelectItem>
              ))}

              <SelectItem value="track:custom">Track: Custom</SelectItem>
            </SelectContent>
          </Select>

          {showCustomInput && (
            <>
              <Label htmlFor="custom-search">Custom search:</Label>
              <Input
                id="custom-search"
                placeholder={`Enter custom ${searchType.type} name...`}
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
              />
            </>
          )}

          <Label htmlFor="artist-filter">Artist filter:</Label>
          <Input
            id="artist-filter"
            placeholder="Filter by artist (optional)"
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Error message */}
      {searchQuery.error && (
        <div className="text-red-500">
          {searchQuery.error instanceof Error
            ? searchQuery.error.message
            : String(searchQuery.error)}
        </div>
      )}

      {/* Search results */}
      {searchQuery.data && (
        <MusicBrainzSearchResults
          results={searchQuery.data}
          onConfirm={onConfirm}
          isLoading={searchQuery.isLoading}
          searchType={searchType.type}
        />
      )}
    </>
  );
}
