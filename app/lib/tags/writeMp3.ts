import { execFile } from "child_process";
import { promisify } from "util";
import { env } from "~/lib/env";
import { type WritableTags } from "./musicMetadata";
import { createWriteResult, getChangedTags } from "./writeMetadata";
import { type WriteResult } from "./writeMetadata";

const execFileAsync = promisify(execFile);

// MP3 tag name mapping (mid3v2 uses different argument names)
const MP3_TAG_MAPPING = {
  title: "--song",
  artists: "--artist",
  album: "--album",
  albumArtist: "--album-artist",
  trackNumber: "--track",
  discNumber: "--disc",
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
    // Get changed tags (as single values for MP3)
    const changedTags = await getChangedTags(
      filePath,
      newTags,
      true,
      MP3_TAG_MAPPING,
    );

    // If no tags have changed, return success
    if (Object.keys(changedTags).length === 0) {
      return createWriteResult(filePath, true);
    }

    // Special handling for multiple artists in MP3
    // If there are multiple artists, also set the TPE2 frame
    if (
      changedTags["--artist"] &&
      typeof changedTags["--artist"] === "string" &&
      changedTags["--artist"].includes(";")
    ) {
      changedTags["--TPE2"] = changedTags["--artist"];
    }

    // Build the mid3v2 command arguments
    const mid3v2Path = env.MID3V2_PATH || "mid3v2";
    const args: string[] = [];

    // Add each tag to the arguments
    for (const [key, value] of Object.entries(changedTags)) {
      args.push(key);
      args.push(value as string);
    }

    // Add the file path as the last argument
    args.push(filePath);

    await execFileAsync(mid3v2Path, args);
    return createWriteResult(filePath, true);
  } catch (error) {
    return createWriteResult(filePath, false, error);
  }
}
