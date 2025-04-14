import type {
  CleanVgmdbAlbum,
  VgmdbAlbum,
  VgmdbArtist,
  VgmdbNames,
} from "./vgmdb";

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
 * Helper function to extract artist names from an array of VGMDB artists
 * @returns A string of artist names separated by semicolons
 */
export function formatArtistNames(artists: VgmdbArtist[]): string {
  return artists
    .map((artist) => getPreferredVgmdbName(artist.names))
    .join("; ");
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
      disc_length: disc.disc_length,
      name: disc.name,
      tracks: disc.tracks.map((track) => ({
        names: track.names,
        track_length: track.track_length,
      })),
    })),
    composers: album.composers,
    arrangers: album.arrangers,
    performers: album.performers,
    release_date: album.release_date,
  };
}
