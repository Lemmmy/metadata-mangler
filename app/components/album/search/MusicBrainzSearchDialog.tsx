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
import { parseCatalogNumber } from "~/lib/fetch/metadataUtils";
import { useTRPCClient } from "~/lib/trpc";
import { MusicBrainzSearchResults } from "./MusicBrainzSearchResults";
import type { MusicBrainzReleaseResult } from "~/lib/fetch/musicbrainz";
import { useMetadataStore } from "../useMetadataStore";
import { useShallow } from "zustand/react/shallow";

export interface MusicBrainzSearchDialogProps {
  dirName: string;
  onConfirm: (id: string) => void;
}

export interface ProcessedMusicBrainzReleaseResult
  extends MusicBrainzReleaseResult {
  catalogNumberMatched: boolean;
}

type SearchType =
  | { type: "release"; query: string; custom?: boolean }
  | { type: "catno"; query: string; custom?: boolean }
  | { type: "track"; query: string; custom?: boolean };

export function MusicBrainzSearchDialog({
  dirName,
  onConfirm,
}: MusicBrainzSearchDialogProps) {
  const { albumName, albumArtist, catalogNumberTag, tracks } = useMetadataStore(
    useShallow((s) => ({
      albumName: s.album?.name || "",
      albumArtist: s.album?.artist || "",
      catalogNumberTag: s.album?.catalogNumber || "",
      tracks: s.tracks,
    })),
  );

  const [searchType, setSearchType] = useState<SearchType>({
    type: "release",
    query: albumName,
  });
  const [customSearch, setCustomSearch] = useState("");
  const [artistFilter, setArtistFilter] = useState(albumArtist);

  // Track options for the select dropdown. Deduplicate track titles
  const trackOptions = useMemo(() => {
    const uniqueTitles = Array.from(new Set(tracks.map((t) => t.title)));
    return uniqueTitles;
  }, [tracks]);

  const showCustomInput = searchType.custom; // Whether to show the custom search input

  const query = useMemo(() => {
    if (searchType.custom) {
      return customSearch;
    }
    return searchType.query;
  }, [searchType, customSearch]);

  const [throttledQuery] = useThrottledValue(query, {
    wait: 1000,
    leading: true,
  });
  const [throttledArtistFilter] = useThrottledValue(artistFilter, {
    wait: 1000,
    leading: true,
  });

  const trpcClient = useTRPCClient();
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
          searchType: "release",
          artistFilter: throttledArtistFilter,
        });
      } else if (searchType.type === "catno") {
        return await trpcClient.search.musicBrainzReleases.query({
          query: throttledQuery,
          searchType: "catno",
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

  const handleSearchTypeChange = (value: string) => {
    if (value.startsWith("release:")) {
      if (value === "release:custom") {
        setSearchType({ type: "release", query: "", custom: true });
      } else if (value === "release:album") {
        setSearchType({ type: "release", query: albumName });
      } else if (value === "release:directory") {
        setSearchType({ type: "release", query: dirName });
      }
    } else if (value.startsWith("catno:")) {
      if (value === "catno:custom") {
        setSearchType({ type: "catno", query: "", custom: true });
      } else {
        // Extract catalog number from the value (e.g., "catno:1234567890" -> "1234567890")
        const catalogNumber = value.substring(6);
        setSearchType({ type: "catno", query: catalogNumber });
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

  const catalogNumbers = useMemo(() => {
    return new Set([
      ...parseCatalogNumber(dirName),
      ...parseCatalogNumber(catalogNumberTag),
    ]);
  }, [dirName, catalogNumberTag]);

  const rawResults = searchQuery.data;
  const sortedResults = useMemo(() => {
    if (!rawResults) return [];

    const out: ProcessedMusicBrainzReleaseResult[] = [];

    for (const result of rawResults) {
      const catalogNumberMatched =
        !!result.catalog && catalogNumbers.has(result.catalog);

      if (catalogNumberMatched) {
        // If there's a catalog number match in the results, it should be pushed to the top of the list.
        out.unshift({
          ...result,
          catalogNumberMatched,
        });
      } else {
        out.push({
          ...result,
          catalogNumberMatched,
        });
      }
    }

    return out;
  }, [rawResults, catalogNumbers]);

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

              {[...catalogNumbers].map((catalogNumber) => (
                <SelectItem
                  key={catalogNumber}
                  value={`catno:${catalogNumber}`}
                >
                  Catalog Number: {catalogNumber}
                </SelectItem>
              ))}
              <SelectItem value="catno:custom">
                Catalog Number: Custom
              </SelectItem>

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
      <MusicBrainzSearchResults
        results={sortedResults}
        onConfirm={onConfirm}
        isLoading={searchQuery.isLoading}
        searchType={searchType.type}
      />
    </>
  );
}
