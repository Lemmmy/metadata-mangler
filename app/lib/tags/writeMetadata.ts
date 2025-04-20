import * as path from "path";
import { readTrackFromFile, type WritableTags } from "./musicMetadata";
import { writeFlacTags } from "./writeFlac";
import { writeMp3Tags } from "./writeMp3";
import { writeOggTags } from "./writeOgg";

export interface WriteResult {
  filePath: string;
  success: boolean;
  error?: string;
}

/**
 * Writes metadata tags to a music file based on its format
 * @param filePath Path to the music file
 * @param tags Tags to write
 * @returns Promise resolving to a WriteResult object
 */
export async function writeTagsToFile(
  filePath: string,
  tags: Partial<WritableTags>,
): Promise<WriteResult> {
  try {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case ".flac":
        return await writeFlacTags(filePath, tags);
      case ".mp3":
        return await writeMp3Tags(filePath, tags);
      case ".ogg":
        return await writeOggTags(filePath, tags);
      default:
        return {
          filePath,
          success: false,
          error: `Unsupported file format: ${ext}`,
        };
    }
  } catch (error) {
    return {
      filePath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Writes metadata tags to multiple music files in parallel
 * @param filePaths Array of file paths
 * @param tagsList Array of tag objects corresponding to each file
 * @param concurrency Maximum number of concurrent write operations
 * @returns Promise resolving to an array of WriteResult objects
 */
export async function writeTagsToFiles(
  filePaths: string[],
  tagsList: Partial<WritableTags>[],
  concurrency = 4,
): Promise<WriteResult[]> {
  if (filePaths.length !== tagsList.length) {
    throw new Error("Number of files and tag objects must match");
  }

  const results: WriteResult[] = [];

  // Process files in batches based on concurrency
  for (let i = 0; i < filePaths.length; i += concurrency) {
    const batch = filePaths.slice(i, i + concurrency);
    const batchTags = tagsList.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map((filePath, index) =>
        writeTagsToFile(filePath, batchTags[index]),
      ),
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Compares new tags with existing tags and returns only the changed ones
 * @param existingTrack The existing track metadata
 * @param newTags The new tags to compare
 * @param singleValueTags Whether to return single values (true) or arrays (false)
 * @param tagMapping Optional mapping from WritableTags fields to tag names
 * @returns Object containing only the changed tags
 */
export async function getChangedTags(
  filePath: string,
  newTags: Partial<WritableTags>,
  singleValueTags = false,
  tagMapping: Partial<Record<keyof WritableTags, string>> = {},
): Promise<Record<keyof WritableTags, string | string[]>> {
  // Read existing tags to compare
  const existingTrack = await readTrackFromFile(filePath, false, false);

  // Mapping of WritableTags fields to tag names (default if not provided)
  const mapping: Record<keyof WritableTags, string> = {
    title: tagMapping.title || "TITLE",
    artists: tagMapping.artists || "ARTIST",
    album: tagMapping.album || "ALBUM",
    albumArtist: tagMapping.albumArtist || "ALBUMARTIST",
    trackNumber: tagMapping.trackNumber || "TRACKNUMBER",
    discNumber: tagMapping.discNumber || "DISCNUMBER",
    year: tagMapping.year || "YEAR",
    date: tagMapping.date || "DATE",
    grouping: tagMapping.grouping || "CONTENTGROUP",
  };

  // Only include tags that have changed
  const changedTags: Record<string, string | string[]> = {};

  // Check each tag
  if (newTags.title !== undefined && newTags.title !== existingTrack.title) {
    changedTags[mapping.title] = singleValueTags
      ? newTags.title
      : [newTags.title];
  }

  if (
    newTags.artists !== undefined &&
    newTags.artists !== existingTrack.artists
  ) {
    // Split artists by semicolon
    const artistArray = newTags.artists
      .split(";")
      .map((artist) => artist.trim())
      .filter(Boolean);

    changedTags[mapping.artists] = singleValueTags
      ? artistArray.join("; ")
      : artistArray;
  }

  if (newTags.album !== undefined && newTags.album !== existingTrack.album) {
    changedTags[mapping.album] = singleValueTags
      ? newTags.album
      : [newTags.album];
  }

  if (
    newTags.albumArtist !== undefined &&
    newTags.albumArtist !== existingTrack.albumArtist
  ) {
    changedTags[mapping.albumArtist] = singleValueTags
      ? newTags.albumArtist
      : [newTags.albumArtist];
  }

  if (
    newTags.trackNumber !== undefined &&
    newTags.trackNumber !== existingTrack.trackNumber
  ) {
    const trackNumberStr = newTags.trackNumber.toString();
    changedTags[mapping.trackNumber] = singleValueTags
      ? trackNumberStr
      : [trackNumberStr];
  }

  if (
    newTags.discNumber !== undefined &&
    newTags.discNumber !== existingTrack.discNumber
  ) {
    const discNumberStr = newTags.discNumber.toString();
    changedTags[mapping.discNumber] = singleValueTags
      ? discNumberStr
      : [discNumberStr];
  }

  return changedTags;
}

/**
 * Creates a standard result object for tag writing operations
 */
export function createWriteResult(
  filePath: string,
  success: boolean,
  error?: unknown,
): WriteResult {
  return {
    filePath,
    success,
    error:
      error instanceof Error
        ? error.message
        : error
          ? String(error)
          : undefined,
  };
}
