import { LRUCache } from "lru-cache";
import type { SupplementalDataSource } from "../ai/aiMetadata";
import {
  cleanMusicBrainzRelease,
  fetchDetailedMusicBrainzRelease,
  getMusicBrainzCatalogNumber,
} from "../fetch/musicbrainz";
import { fetchVgmdbAlbum, parseVgmdbReleaseDate } from "../fetch/vgmdb";
import { cleanVgmdbAlbum, isBarcode } from "./vgmdbUtils";

const URL_PATTERNS = {
  vgmdb: /^https?:\/\/(www\.)?vgmdb\.(net|info)\/album\/(\d+)/i,
  musicbrainz:
    /^https?:\/\/((?:www|beta)\.)?musicbrainz\.org\/release\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
  bandcamp: /^https?:\/\/.*\.bandcamp\.com\/(album|track)\/[a-zA-Z0-9-]+/i,
};

export interface SupplementalData {
  cleanRaw: string;
  raw: any;
  albumName?: string;
  albumArtist?: string;
  year?: string;
  date?: string;
  catalogNumber?: string;
  barcode?: string;
}

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
): Promise<SupplementalData | null> {
  if (source === "user") {
    return { cleanRaw: input, raw: input };
  } else if (source === "vgmdb") {
    const match = input.match(URL_PATTERNS.vgmdb);
    if (match && match[3]) {
      const albumId = parseInt(match[3], 10);
      const vgmdbAlbum = await fetchVgmdbAlbum(albumId);
      const cleanedAlbum = cleanVgmdbAlbum(vgmdbAlbum);
      const [year, date] = parseVgmdbReleaseDate(vgmdbAlbum.release_date);
      const catalogIsBarcode = isBarcode(vgmdbAlbum.catalog);

      return {
        cleanRaw: JSON.stringify(cleanedAlbum),
        raw: vgmdbAlbum,
        albumName: cleanedAlbum.name,
        year,
        date,
        catalogNumber: catalogIsBarcode ? undefined : vgmdbAlbum.catalog,
        barcode: catalogIsBarcode ? vgmdbAlbum.catalog : undefined,
      };
    }
  } else if (source === "musicbrainz") {
    const match = input.match(URL_PATTERNS.musicbrainz);
    if (match && match[2]) {
      const releaseId = match[2];
      const detailedRelease = await fetchDetailedMusicBrainzRelease(releaseId);
      const cleanedAlbum = cleanMusicBrainzRelease(detailedRelease);

      return {
        cleanRaw: JSON.stringify(cleanedAlbum),
        raw: detailedRelease,
        albumName: cleanedAlbum.albumName,
        year: detailedRelease.date?.split("-")[0],
        date: detailedRelease.date,
        catalogNumber: getMusicBrainzCatalogNumber(detailedRelease),
        barcode: detailedRelease.barcode,
      };
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

const cache = new LRUCache<string, SupplementalData>({
  max: 100,
  ttl: 60 * 60 * 1000, // 1 hour
});

export async function fetchCachedSupplementalData(
  source: SupplementalDataSource,
  input: string,
): Promise<SupplementalData | null> {
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
    const vgmdbAlbum = await fetchCachedSupplementalData("vgmdb", input);
    if (!vgmdbAlbum) return null;
    return (
      vgmdbAlbum.raw.covers[0]?.full ||
      vgmdbAlbum.raw.covers[0]?.thumb ||
      vgmdbAlbum.raw.picture_full ||
      vgmdbAlbum.raw.picture_small ||
      vgmdbAlbum.raw.picture_thumb ||
      null
    );
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
