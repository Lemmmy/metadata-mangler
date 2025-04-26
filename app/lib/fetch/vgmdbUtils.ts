import type { CleanVgmdbAlbum, VgmdbAlbum, VgmdbNames } from "./vgmdb";

/**
 * Helper function to get the preferred name from a VGMDB names object
 * Prioritizes Romaji, then English, then Japanese, then any other available name
 */
export function getPreferredVgmdbName(names: VgmdbNames): string {
  // Try different name formats in order of preference
  return (
    names.Romaji ||
    names["ja-latn"] ||
    names.English ||
    names.en ||
    names.Japanese ||
    names.ja ||
    Object.values(names).find(Boolean) ||
    "Unknown"
  );
}

/**
 * Creates a stripped-down version of the VgmdbAlbum for AI inference
 * @param album The full VgmdbAlbum object
 * @returns A cleaned version with only essential data
 */
export function cleanVgmdbAlbum(album: VgmdbAlbum): CleanVgmdbAlbum {
  return {
    name: album.name,
    names: album.names,
    notes: album.notes,
    discs: album.discs.map((disc) => ({
      name: disc.name,
      tracks: disc.tracks.map((track) => ({
        names: track.names,
      })),
    })),
    composers: album.composers,
    arrangers: album.arrangers,
    performers: album.performers,
    release_date: album.release_date,
  };
}
