import { useThrottler } from "@tanstack/react-pacer";
import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { initKuroshiro } from "../../lib/jp/useKuroshiro";
import { Input } from "../ui/input";
import type {
  DirectoryListEntry,
  ProcessedDirectoryListEntry,
} from "./DirectoryList";
import dayjs from "dayjs";

interface IndexedEntry extends ProcessedDirectoryListEntry {
  romaji?: string;
}

type FuseT = Fuse<IndexedEntry>;

export type SortType = "name_asc" | "name_desc" | "mtime_asc" | "mtime_desc";
export const sortByNames: Record<SortType, string> = {
  name_asc: "Name (A–Z)",
  name_desc: "Name (Z–A)",
  mtime_desc: "Date (newest first)",
  mtime_asc: "Date (oldest first)",
};

const sortByFn: Record<
  SortType,
  (a: ProcessedDirectoryListEntry, b: ProcessedDirectoryListEntry) => number
> = {
  name_asc: (a, b) =>
    a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }),
  name_desc: (a, b) =>
    b.name.localeCompare(a.name, "en", { numeric: true, sensitivity: "base" }),
  mtime_asc: (a, b) =>
    (a.mtime ? a.mtime.valueOf() : 0) - (b.mtime ? b.mtime.valueOf() : 0),
  mtime_desc: (a, b) =>
    (b.mtime ? b.mtime.valueOf() : 0) - (a.mtime ? a.mtime.valueOf() : 0),
};

export function useDirectorySearch(
  entries: DirectoryListEntry[],
  sort: SortType,
) {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery("");
  }, [entries]);

  const processedEntries = useMemo(() => {
    const newEntries = entries.map((e) => ({
      ...e,
      mtime: e.mtime ? dayjs(e.mtime) : null,
    }));
    newEntries.sort(sortByFn[sort]);
    return newEntries;
  }, [entries, sort]);

  const [results, setResults] =
    useState<ProcessedDirectoryListEntry[]>(processedEntries);
  const [fuse, setFuse] = useState<FuseT | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Convert Japanese names to romaji
      const kuroshiro = await initKuroshiro();
      const processed = await Promise.all(
        processedEntries.map(async (entry) => {
          const reading = await kuroshiro.convert(entry.name, {
            to: "romaji",
            romajiSystem: "hepburn",
          });

          return {
            ...entry,
            romaji: reading,
          } satisfies IndexedEntry;
        }),
      );

      // Initialize fuzzy search
      setFuse(
        new Fuse(processed, {
          keys: ["name", "romaji"],
          threshold: 0.6,
          distance: 100,
          isCaseSensitive: false,
          ignoreDiacritics: true,
        }),
      );
    })()
      .catch((err) => {
        console.error("Error initializing kuroshiro:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [processedEntries]);

  const throttledSearch = useThrottler(
    (fuse: FuseT, query) => {
      setResults(fuse.search(query).map(({ item }) => item));
    },
    { wait: 100, leading: true },
  );

  // Update search results when query changes
  useEffect(() => {
    if (!fuse || !query) {
      setResults(processedEntries);
    } else {
      throttledSearch.maybeExecute(fuse, query);
    }
  }, [query, fuse, processedEntries, throttledSearch]);

  const searchBox = (
    <Input
      type="search"
      placeholder="Filter..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );

  return {
    query,
    setQuery,
    results,
    loading,
    searchBox,
  };
}
