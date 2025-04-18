import { LRUCache } from "lru-cache";
import type { SupplementalDataSource } from "../ai/aiMetadata";
import { fetchVgmdbAlbum } from "../fetch/vgmdb";
import { cleanVgmdbAlbum } from "./vgmdbUtils";

const URL_PATTERNS = {
  vgmdb: /^https?:\/\/(www\.)?vgmdb\.(net|info)\/album\/(\d+)/i,
  musicbrainz:
    /^https?:\/\/(www\.)?musicbrainz\.org\/release\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
  bandcamp: /^https?:\/\/.*\.bandcamp\.com\/(album|track)\/[a-zA-Z0-9-]+/i,
};

export function parseSupplementalDataSource(
  input: string,
): SupplementalDataSource {
  for (const [source, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(input)) {
      return source as SupplementalDataSource;
    }
  }
  return "user";
}

async function fetchSupplementalData(
  source: SupplementalDataSource,
  input: string,
): Promise<string | null> {
  if (source === "user") {
    return input;
  } else if (source === "vgmdb") {
    const match = input.match(URL_PATTERNS.vgmdb);
    if (match && match[3]) {
      const albumId = parseInt(match[3], 10);
      const vgmdbAlbum = await fetchVgmdbAlbum(albumId);
      const cleanedAlbum = cleanVgmdbAlbum(vgmdbAlbum);

      return JSON.stringify(cleanedAlbum);
    }
  } else if (source === "musicbrainz") {
    const match = input.match(URL_PATTERNS.musicbrainz);
    if (match && match[1]) {
      const releaseId = match[1];
      // TODO: Implement musicbrainz data fetching
      return null;
    }
  } else if (source === "bandcamp") {
    const match = input.match(URL_PATTERNS.bandcamp);
    if (match && match[1]) {
      const releaseId = match[1];
      // TODO: Implement bandcamp data fetching
      return null;
    }
  }

  return null;
}

const cache = new LRUCache<string, string>({
  max: 100,
  ttl: 60 * 60 * 1000, // 1 hour
});

export async function fetchCachedSupplementalData(
  source: SupplementalDataSource,
  input: string,
): Promise<string | null> {
  // TODO: Race conditions still possible
  const cachedValue = cache.get(input);
  if (cachedValue) return cachedValue;

  const result = await fetchSupplementalData(source, input);
  if (result) cache.set(input, result);
  return result;
}

// Returns the best cover image URL from a supported source URL (vgmdb, etc)
export async function getBestCoverFromSourceUrl(
  source: SupplementalDataSource,
  input: string,
): Promise<string | null> {
  if (source === "user") {
    return input;
  } else if (source === "vgmdb") {
    const match = input.match(URL_PATTERNS.vgmdb);
    if (match && match[3]) {
      const albumId = parseInt(match[3], 10);
      const vgmdbAlbum = await fetchVgmdbAlbum(albumId);
      return (
        vgmdbAlbum.covers[0]?.full ||
        vgmdbAlbum.covers[0]?.thumb ||
        vgmdbAlbum.picture_full ||
        vgmdbAlbum.picture_small ||
        vgmdbAlbum.picture_thumb ||
        null
      );
    }
  } else if (source === "musicbrainz") {
    const match = input.match(URL_PATTERNS.musicbrainz);
    if (match && match[1]) {
      const releaseId = match[1];
      // TODO: Implement musicbrainz data fetching
      return null;
    }
  } else if (source === "bandcamp") {
    const match = input.match(URL_PATTERNS.bandcamp);
    if (match && match[1]) {
      const releaseId = match[1];
      // TODO: Implement bandcamp data fetching
      return null;
    }
  }

  return null;
}
