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

export const vgmdbUrlPatterns = {
  vgmdbArtist: /^https?:\/\/(www\.)?vgmdb\.(net|info)\/artist\/(\d+)/i,
  vgmdbAlbum: /^https?:\/\/(www\.)?vgmdb\.(net|info)\/album\/(\d+)/i,
} as const;

export function parseVgmdbArtistUrl(url: string): number | null {
  const match = url.match(vgmdbUrlPatterns.vgmdbArtist);
  if (match && match[3]) {
    return parseInt(match[3], 10);
  }
  return null;
}

export function parseVgmdbAlbumUrl(url: string): number | null {
  const match = url.match(vgmdbUrlPatterns.vgmdbAlbum);
  if (match && match[3]) {
    return parseInt(match[3], 10);
  }
  return null;
}

export function convertVgmdbArtistIdToUrl(artistId: number): string {
  return `https://vgmdb.net/artist/${artistId}`;
}

export function convertVgmdbAlbumIdToUrl(albumId: number): string {
  return `https://vgmdb.net/album/${albumId}`;
}

export const ignoredVgmdbRoles = [
  // non-music roles
  "director",
  "planner",
  "project planner",
  "writer",
  "lyricist",
  "talk editor",
  "designer",
  "graphic designer",
  "illustrator",
  // engineering roles
  "recording engineer",
  "mixing engineer",
  "mastering engineer",
  "vocal recording engineer",
];

export function cleanVgmdbRole(role: string): string {
  return role
    .replace(/(?: \(as .+?\))?/g, "")
    .replace(/\*$/, "")
    .trim();
}

export function cleanVgmdbRoles(roles: string, includeIgnored = false): string {
  return roles
    .split(", ")
    .map((role) => {
      const cleanRole = cleanVgmdbRole(role);
      if (
        !includeIgnored &&
        ignoredVgmdbRoles.includes(cleanRole.toLowerCase())
      ) {
        return null;
      }
      return cleanRole;
    })
    .filter(Boolean)
    .join(", ");
}

export function areAllRolesIgnored(roles: string): boolean {
  if (!roles) return false;
  return roles
    .split(", ")
    .map(cleanVgmdbRole)
    .every((role) => ignoredVgmdbRoles.includes(role.toLowerCase()));
}
