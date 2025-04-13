import { useThrottler } from "@tanstack/react-pacer";
import Fuse from "fuse.js";
import { useEffect, useState } from "react";
import { initKuroshiro } from "../../lib/jp/useKuroshiro";
import { Input } from "../ui/input";
import type { DirectoryListEntry } from "./DirectoryList";

interface IndexedEntry extends DirectoryListEntry {
  romaji?: string;
}

export function useDirectorySearch(entries: DirectoryListEntry[]) {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [fuse, setFuse] = useState<Fuse<DirectoryListEntry> | null>(null);
  const [results, setResults] = useState<DirectoryListEntry[]>(entries);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Convert Japanese names to romaji
      const kuroshiro = await initKuroshiro();
      const processed = await Promise.all(
        entries.map(async (entry) => {
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

      console.log(processed);

      // Initialize fuzzy search
      setFuse(
        new Fuse<IndexedEntry>(processed, {
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
  }, [entries]);

  const throttledSearch = useThrottler(
    (fuse: Fuse<DirectoryListEntry>, query) => {
      setResults(fuse.search(query).map(({ item }) => item));
    },
    { wait: 100, leading: true },
  );

  // Update search results when query changes
  useEffect(() => {
    if (!fuse || !query) {
      setResults(entries);
    } else {
      throttledSearch.maybeExecute(fuse, query);
    }
  }, [query, fuse, entries, throttledSearch]);

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
