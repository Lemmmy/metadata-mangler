import * as fsp from "fs/promises";
import * as path from "path";
import { parseFile } from "music-metadata";
import { stripLibraryPath } from "../paths";
import { env } from "../env";
import sharp from "sharp";

/**
 * Represents a music track with metadata
 */
export interface FileTrack {
  directory: string;
  filename: string;

  trackNumber: number;
  discNumber: number;

  title: string;
  artists: string; // semicolon separated
  album: string;
  albumArtist: string;

  duration: number;
  coverArt: Uint8Array | null;

  container: string;
  codec: string;
  tagTypes: string[];
}

export type WebTrack = Omit<FileTrack, "coverArt">;

export type WritableTags = Pick<
  FileTrack,
  "trackNumber" | "discNumber" | "title" | "artists" | "album" | "albumArtist"
>;

export const supportedFileTypes = [".flac", ".mp3", ".ogg"];
export const supportedFileTypesLut = new Set(supportedFileTypes);

/**
 * Reads metadata from a music file and converts it to our Track interface
 * @param filePath Full path to the music file
 * @returns Promise resolving to a Track object
 */
export async function readTrackFromFile(
  filePath: string,
  duration: boolean,
  coverArt: boolean,
): Promise<FileTrack> {
  try {
    const metadata = await parseFile(filePath, {
      duration,
      skipCovers: !coverArt,
    });

    // Extract directory and filename
    const directory = path.dirname(filePath);
    const filename = path.basename(filePath);

    const trackInfo = metadata.common.track || { no: null, of: null };
    const trackNumber = trackInfo.no || 0;
    const discInfo = metadata.common.disk || { no: null, of: null };
    const discNumber = discInfo.no || 1;

    // Extract artists
    // If we have an array of artists, join them with semicolons
    // Otherwise use the artist field, or empty string if not available
    const artistsArray = metadata.common.artists || [];
    const artistString =
      artistsArray.length > 0
        ? artistsArray.join("; ")
        : metadata.common.artist || "";

    return {
      directory,
      filename,

      trackNumber,
      discNumber,

      title: metadata.common.title || "",
      artists: artistString,
      album: metadata.common.album || "",
      albumArtist: metadata.common.albumartist || "",

      duration: metadata.format.duration || 0,
      coverArt: metadata.common.picture?.[0]?.data || null,

      container: metadata.format.container || "",
      codec: metadata.format.codec || "",
      tagTypes: metadata.format.tagTypes || [],
    };
  } catch (error) {
    console.error(`Error reading metadata from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Reads all music files from a directory recursively and returns their metadata
 * @param directoryPath Path to the directory to scan
 * @returns Promise resolving to an array of Track objects
 */
export async function readTracksFromDirectory(
  directoryPath: string,
  limit: number = env.ALBUM_TRACK_LIMIT,
): Promise<FileTrack[]> {
  const tracks: FileTrack[] = [];

  async function scanDirectory(dir: string): Promise<void> {
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true });

      // Process files and directories in parallel
      const promises = entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath); // Recursively scan subdirectories
        } else if (entry.isFile() && isSupportedMusicFile(fullPath)) {
          try {
            const track = await readTrackFromFile(fullPath, true, true);
            tracks.push(track);

            if (tracks.length >= limit) {
              console.warn(`Limit of ${limit} tracks reached`);
              return;
            }
          } catch (error) {
            console.error(`Error processing file ${fullPath}:`, error);
            // Continue with other files even if one fails
          }
        }
      });

      // Wait for all files and subdirectories to be processed
      await Promise.all(promises);
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
      throw error;
    }
  }

  // Start scanning from the provided directory
  await scanDirectory(directoryPath);

  return tracks.sort((a, b) => {
    // First sort by disc number
    if (a.discNumber !== b.discNumber) return a.discNumber - b.discNumber;
    // Then sort by track number
    if (a.trackNumber !== b.trackNumber) return a.trackNumber - b.trackNumber;
    // Then sort by filename
    return a.filename.localeCompare(b.filename);
  });
}

/**
 * Checks if a file is a supported music file
 * @param filePath Path to the file to check
 * @returns True if the file is a supported music file, false otherwise
 */
export function isSupportedMusicFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return supportedFileTypesLut.has(ext);
}

/**
 * Gets the album name from a set of tracks
 * @param tracks Array of Track objects
 * @returns The album name if available, or null if not found
 */
export function getAlbumName(tracks: FileTrack[]): string | null {
  if (tracks.length === 0) return null;
  return tracks.find((t) => t.album)?.album || null;
}

/**
 * Gets the album artist from a set of tracks
 * @param tracks Array of Track objects
 * @returns The album artist if available, or null if not found
 */
export function getAlbumArtist(tracks: FileTrack[]): string | null {
  if (tracks.length === 0) return null;
  return (
    tracks.find((t) => t.albumArtist)?.albumArtist ||
    tracks.find((t) => t.artists)?.artists ||
    null
  );
}

/**
 * Gets the album cover art from a set of tracks
 * @param tracks Array of Track objects
 * @returns The cover art as a Uint8Array if available, or null if not found
 */
export async function getAlbumCoverArt(
  tracks: FileTrack[],
): Promise<Uint8Array | null> {
  if (tracks.length === 0) return null;

  // First try to find embedded cover art in tracks
  const embeddedCoverArt = tracks.find((t) => t.coverArt)?.coverArt || null;
  if (embeddedCoverArt) return embeddedCoverArt;

  // If no embedded cover art found, search for image files in track directories
  const supportedImageExtensions = [".jpg", ".jpeg", ".png"];
  const coverArtFilePatterns = ["cover", "folder", "artwork", "front", "back"];

  // Get unique directories from tracks
  const directories = [...new Set(tracks.map((track) => track.directory))];

  async function scanDirectory(dir: string): Promise<Uint8Array | null> {
    // Get all files in the directory
    const files = await fsp.readdir(dir, { withFileTypes: true });

    // First check for common cover art filenames
    for (const pattern of coverArtFilePatterns) {
      for (const ext of supportedImageExtensions) {
        const potentialMatch = files.find(
          (file) =>
            file.isFile() && file.name.toLowerCase() === `${pattern}${ext}`,
        );

        if (potentialMatch) {
          const coverPath = path.join(dir, potentialMatch.name);
          return await fsp.readFile(coverPath);
        }
      }
    }

    // Then check for filenames matching the directory name
    const dirName = path.basename(dir);
    for (const ext of supportedImageExtensions) {
      const potentialMatch = files.find(
        (file) =>
          file.isFile() &&
          file.name.toLowerCase() === `${dirName.toLowerCase()}${ext}`,
      );

      if (potentialMatch) {
        const coverPath = path.join(dir, potentialMatch.name);
        return await fsp.readFile(coverPath);
      }
    }

    // Check for any image files if nothing else matched
    for (const file of files) {
      if (!file.isFile()) continue;
      const ext = path.extname(file.name).toLowerCase();
      if (supportedImageExtensions.includes(ext)) {
        const coverPath = path.join(dir, file.name);
        return await fsp.readFile(coverPath);
      }
    }

    // Scan subdirectories
    for (const file of files) {
      if (!file.isDirectory()) continue;
      const subDir = path.join(dir, file.name);
      const coverArt = await scanDirectory(subDir);
      if (coverArt) return coverArt;
    }

    return null;
  }

  // Try to find cover art in each directory
  for (const directory of directories) {
    try {
      const coverArt = await scanDirectory(directory);
      if (coverArt) return coverArt;
    } catch (error) {
      console.error(`Error searching for cover art in ${directory}:`, error);
      // Continue to next directory if there's an error
    }
  }

  return null;
}

/**
 * Gets the cover art URL for a track or album
 * @param coverArt Cover art Uint8Array
 * @returns Data URL for the cover art
 */
export async function getCoverArtUrl(coverArt: Uint8Array): Promise<string> {
  const buffer = Buffer.from(coverArt);
  const image = await sharp(buffer)
    .resize(384, 384, { fit: "inside" })
    .toFormat("webp", { quality: 90 })
    .toBuffer();
  return `data:image/webp;base64,${image.toString("base64")}`;
}

export function cleanTrackForWeb(track: FileTrack): WebTrack {
  const { coverArt, ...rest } = track;
  return {
    ...rest,
    directory: stripLibraryPath(rest.directory),
  };
}
