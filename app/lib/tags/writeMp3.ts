import { execFile } from "child_process";
import { promisify } from "util";
import { env } from "~/lib/env";
import { type WritableTags } from "./musicMetadata";
import { createWriteResult, getChangedTags } from "./writeMetadata";
import { type WriteResult } from "./writeMetadata";

const execFileAsync = promisify(execFile);

// MP3 tag name mapping (mid3v2 uses different argument names)
const MP3_TAG_MAPPING = {
  title: "--TIT2",
  artists: "--TPE1",
  album: "--TALB",
  albumArtist: "--TPE2",
  trackNumber: "--TRCK",
  discNumber: "--TPOS",
  // year: "--TYER"
};

/**
 * Writes metadata tags to an MP3 file using mid3v2 (from mutagen)
 * @param filePath Path to the MP3 file
 * @param tags Tags to write
 * @returns Promise resolving to a WriteResult object
 */
export async function writeMp3Tags(
  filePath: string,
  newTags: Partial<WritableTags>,
): Promise<WriteResult> {
  try {
    // Get changed tags (as arrays for MP3)
    const changedTags = await getChangedTags(
      filePath,
      newTags,
      false,
      MP3_TAG_MAPPING,
    );

    // If no tags have changed, return success
    if (Object.keys(changedTags).length === 0) {
      return createWriteResult(filePath, true);
    }

    // Build the mid3v2 command arguments
    const mid3v2Path = env.MID3V2_PATH || "mid3v2";
    const args: string[] = [];

    // Add each tag to the arguments, repeating the command argument for each value
    for (const [key, values] of Object.entries(changedTags)) {
      for (const value of values) {
        args.push(key);
        args.push(value);
      }
    }

    // Add the file path as the last argument
    args.push(filePath);

    await execFileAsync(mid3v2Path, args);
    return createWriteResult(filePath, true);
  } catch (error) {
    return createWriteResult(filePath, false, error);
  }
}
