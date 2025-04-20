import { execFile } from "child_process";
import { promisify } from "util";
import { env } from "~/lib/env";
import { type WritableTags } from "./musicMetadata";
import { createWriteResult, getChangedTags } from "./writeMetadata";
import { type WriteResult } from "./writeMetadata";
import * as fsp from "node:fs/promises";

const execFileAsync = promisify(execFile);

/**
 * Writes metadata tags to a FLAC file using metaflac
 * @param filePath Path to the FLAC file
 * @param tags Tags to write
 * @returns Promise resolving to a WriteResult object
 */
export async function writeFlacTags(
  filePath: string,
  newTags: Partial<WritableTags>,
): Promise<WriteResult> {
  try {
    // Get changed tags (as arrays for FLAC)
    const changedTags = await getChangedTags(filePath, newTags, false);

    // If no tags have changed, return success
    if (Object.keys(changedTags).length === 0) {
      return createWriteResult(filePath, true);
    }

    // If the input flac file has no padding, then metaflac won't perform the edit in-place. Instead, it'll write the
    // new data to a temporary file, then rename it. This will result in different permissions/owner for the new file.
    // Grab the owner and permissions of the original file, so we can restore it later.
    // https://xiph.org/flac/api/group__flac__metadata__level2.html#ga46bf9cf7d426078101b9297ba80bb835
    // https://github.com/xiph/flac/blob/8d648456a2d7444d54a579e365bab4c815ac6873/src/libFLAC/metadata_iterators.c#L1539
    const { uid, gid, mode } = await fsp.stat(filePath);

    // Build the metaflac command arguments
    const metaflacPath = env.METAFLAC_PATH || "metaflac";
    const args: string[] = ["--no-utf8-convert"];

    // First, remove existing tags that we're going to change
    for (const key of Object.keys(changedTags)) {
      if (key === "ALBUMARTIST") {
        // Remove legacy "ALBUM ARTIST" tags too
        args.push("--remove-tag=ALBUM ARTIST");
      }

      args.push(`--remove-tag=${key}`);
    }

    // Then add each tag to the command
    for (const [key, values] of Object.entries(changedTags)) {
      for (const value of values as string[]) {
        args.push(`--set-tag=${key}=${value}`);
      }
    }

    // Add the file path as the last argument
    args.push(filePath);

    console.log("Executing metaflac with args:", args);
    await execFileAsync(metaflacPath, args);

    // Restore the original file permissions
    try {
      await fsp.chmod(filePath, mode);
      await fsp.chown(filePath, uid, gid);
    } catch (error) {
      // Not a fatal error, particularly if this is running on Windows
      console.warn("Failed to restore file permissions:", error);
    }

    return createWriteResult(filePath, true);
  } catch (error) {
    return createWriteResult(filePath, false, error);
  }
}
