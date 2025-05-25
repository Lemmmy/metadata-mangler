import { LRUCache } from "lru-cache";
import type { IRelease } from "musicbrainz-api";
import { MusicBrainzApi } from "musicbrainz-api";
import PQueue from "p-queue";
import { appContact, appId } from "../constants";
import { env } from "../env";
import {
  getArtistNamesFromCredit,
  getArtistNamesFromRels,
  getMusicBrainzCatalogNumber,
  getTrackNames,
  type CleanMusicBrainzAlbum,
  type IReleaseWithWorks,
} from "./musicbrainzUtils";

const mbApi = new MusicBrainzApi({
  appName: appId,
  appVersion: "0.0.0",
  appContactInfo: appContact,

  baseUrl: env.MUSICBRAINZ_BASE_URL || undefined,
  disableRateLimiting:
    !!env.MUSICBRAINZ_BASE_URL &&
    env.MUSICBRAINZ_BASE_URL !== "https://musicbrainz.org" &&
    env.MUSICBRAINZ_BASE_URL !== "https://beta.musicbrainz.org",
});

export interface MusicBrainzReleaseResult {
  id: string;
  title?: string;
  artist?: string;
  catalog?: string;
  format?: string;
  country?: string;
  date?: string;
  url: string;
  trackTitle?: string;
}

// LRU caches for MusicBrainz API calls
const releasesSearchCache = new LRUCache<string, MusicBrainzReleaseResult[]>({
  max: 100,
  ttl: 60 * 60 * 1000, // 1 hour
});

const recordingsSearchCache = new LRUCache<string, MusicBrainzReleaseResult[]>({
  max: 100,
  ttl: 60 * 60 * 1000, // 1 hour
});

const releaseCache = new LRUCache<string, MusicBrainzReleaseResult>({
  max: 100,
  ttl: 60 * 60 * 1000, // 1 hour
});

const detailedReleaseCache = new LRUCache<string, IReleaseWithWorks>({
  max: 100,
  ttl: 60 * 60 * 1000, // 1 hour
});

// Escape special Lucene characters in a search query
export function escapeLuceneQuery(query: string): string {
  const specialChars = /[+\-&|!(){}[\]^"~*?:\\/]/g;
  return query.replace(specialChars, (match) => `\\${match}`);
}

// Build a Lucene query for MusicBrainz
export function buildMusicBrainzQuery(
  searchType: "release" | "recording" | "catno",
  searchTerm: string,
  artistFilter?: string,
): string {
  const escapedTerm = escapeLuceneQuery(searchTerm.trim());
  let query = `${searchType}:"${escapedTerm}"`;

  if (searchType !== "catno" && artistFilter && artistFilter.trim()) {
    const escapedArtist = escapeLuceneQuery(artistFilter.trim());
    query = `artist:"${escapedArtist}" AND ${query}`;
  }

  return query;
}

// Search for releases
export async function searchMusicBrainzReleases(
  searchType: "release" | "catno",
  searchTerm: string,
  artistFilter?: string,
) {
  const cacheKey = `${searchTerm}|${artistFilter || ""}`;
  const cachedResults = releasesSearchCache.get(cacheKey);
  if (cachedResults) return cachedResults;

  const query = buildMusicBrainzQuery(searchType, searchTerm, artistFilter);
  const response = await mbApi.search("release", { query, limit: 50 });
  const results = response.releases.map(processReleaseResult);
  releasesSearchCache.set(cacheKey, results);
  return results;
}

// Search for recordings and their associated releases
export async function searchMusicBrainzRecordings(
  searchTerm: string,
  artistFilter?: string,
): Promise<MusicBrainzReleaseResult[]> {
  const cacheKey = `${searchTerm}|${artistFilter || ""}`;
  const cachedResults = recordingsSearchCache.get(cacheKey);
  if (cachedResults) return cachedResults;

  const query = buildMusicBrainzQuery("recording", searchTerm, artistFilter);
  const response = await mbApi.search("recording", { query, limit: 50 });

  // Create release results directly from the recording search results
  const results: MusicBrainzReleaseResult[] = [];

  // Process each recording and its associated releases
  for (const recording of response.recordings) {
    // Skip recordings without releases
    if (!recording.releases || recording.releases.length === 0) {
      continue;
    }

    // Process each release associated with this recording
    for (const release of recording.releases) {
      if (!release.id) continue;

      // Create a release result with the available information
      results.push({
        id: release.id,
        title: release.title || recording.title,
        artist:
          recording["artist-credit"]?.[0]?.artist?.name || "Unknown Artist",
        // We don't have catalog or barcode in the recording search results
        catalog: "",
        format: release.media?.[0]?.format || "",
        country: release.country || "",
        date: release.date || "",
        url: `https://musicbrainz.org/release/${release.id}`,
        trackTitle: recording.title,
      });
    }
  }

  // Remove duplicates based on release ID
  const uniqueResults = Array.from(
    new Map(results.map((item) => [item.id, item])).values(),
  );

  recordingsSearchCache.set(cacheKey, uniqueResults);
  return uniqueResults;
}

// Get a release by ID
export async function getMusicBrainzRelease(id: string) {
  const cachedRelease = releaseCache.get(id);
  if (cachedRelease) return cachedRelease;

  const release = await mbApi.lookup("release", id);
  const result = processReleaseResult(release);

  releaseCache.set(id, result);
  return result;
}

// Process a release result into a standardized format
function processReleaseResult(release: IRelease): MusicBrainzReleaseResult {
  // Extract catalog number from label-info if available
  const catalogNumber = getMusicBrainzCatalogNumber(release);

  return {
    id: release.id,
    title: release.title,
    artist: release["artist-credit"]?.[0]?.artist?.name || "Unknown Artist",
    catalog: catalogNumber || release.barcode || "",
    format: release.media?.[0]?.format || "",
    country: release.country || "",
    date: release.date || "",
    url: `https://musicbrainz.org/release/${release.id}`,
  };
}

const composerTypes = new Set([
  // artist-work rels
  "composer",
]);

const arrangerTypes = new Set([
  // artist-work rels
  "arranger",
  "instrument arranger",
  "orchestrator",
  "vocal arranger",
  // artist-recording rels
  "remixer",
]);

const performerTypes = new Set([
  // artist-recording rels
  "performer",
  "vocal",
]);

// Fetch detailed MusicBrainz release data including tracks and credits
export async function fetchDetailedMusicBrainzRelease(
  releaseId: string,
): Promise<IReleaseWithWorks> {
  const cachedRelease = detailedReleaseCache.get(releaseId);
  if (cachedRelease) return cachedRelease;

  const release = (await mbApi.lookup("release", releaseId, [
    "recordings",
    "artist-credits",
    "release-groups",
    "artists",
    "labels",
    "release-rels",
    "recording-rels",
    "artist-rels",
    "aliases",
  ])) as IReleaseWithWorks;

  // In order to retrieve the composers, etc, we need to retrieve the recordings, and then retrieve the works for those
  // recordings.
  const lookupQueue = new PQueue({ concurrency: 4 });

  for (const media of release.media) {
    for (const track of media.tracks) {
      const recordingId = track.recording?.id;
      if (!recordingId) continue;

      lookupQueue.add(async () => {
        const recording = await mbApi.lookup("recording", recordingId, [
          "work-rels",
          "artist-rels",
        ]);

        track.relations = recording.relations;

        track.works = await Promise.all(
          (recording.relations || [])
            .filter((r) => r.work?.id)
            .map((r) =>
              mbApi.lookup("work", r.work!.id, ["aliases", "artist-rels"]),
            ),
        );
      });
    }
  }

  await lookupQueue.onIdle();

  detailedReleaseCache.set(releaseId, release);
  return release;
}

// Clean MusicBrainz release data for AI inference
export function cleanMusicBrainzRelease(
  release: IReleaseWithWorks,
): CleanMusicBrainzAlbum {
  // Clean the data for AI inference
  const cleanAlbum: CleanMusicBrainzAlbum = {
    albumName: release.title,
    albumArtist: getArtistNamesFromCredit(release["artist-credit"]),
    discs: [],
  };

  if (!release.media || release.media.length === 0) {
    return cleanAlbum;
  }

  // Process media/discs and tracks
  cleanAlbum.discs = release.media.map((media) => {
    return {
      position: media.position || 1,
      tracks: (media.tracks || []).map((track) => {
        return {
          position: track.position,
          title: getTrackNames(track.title, track.recording),
          artist: getArtistNamesFromCredit(track["artist-credit"]),
          composers: getArtistNamesFromRels(
            track.works?.flatMap((w) => w.relations || []),
            (t) => composerTypes.has(t),
          ),
          arrangers: getArtistNamesFromRels(
            (track.works?.flatMap((w) => w.relations || []) || []).concat(
              track.relations || [],
            ),
            (t) => arrangerTypes.has(t),
          ),
          performers: getArtistNamesFromRels(track.relations, (t) =>
            performerTypes.has(t),
          ),
        };
      }),
    };
  });

  return cleanAlbum;
}
