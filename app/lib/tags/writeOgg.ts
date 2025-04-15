import { execFile } from "child_process";
import { promisify } from "util";
import { env } from "~/lib/env";
import { type WritableTags } from "./musicMetadata";
import { createWriteResult, getChangedTags } from "./writeMetadata";
import { type WriteResult } from "./writeMetadata";

const execFileAsync = promisify(execFile);

/**
 * Writes metadata tags to an OGG file using vorbiscomment
 * @param filePath Path to the OGG file
 * @param tags Tags to write
 * @returns Promise resolving to a WriteResult object
 */
export async function writeOggTags(
  filePath: string,
  newTags: Partial<WritableTags>,
): Promise<WriteResult> {
  try {
    // Get changed tags (as arrays for OGG)
    const changedTags = await getChangedTags(filePath, newTags, false);

    // If no tags have changed, return success
    if (Object.keys(changedTags).length === 0) {
      return createWriteResult(filePath, true);
    }

    // Build the vorbiscomment command arguments
    const vorbiscommentPath = env.VORBISCOMMENT_PATH || "vorbiscomment";
    const args: string[] = ["-w"]; // -w flag to write in-place (overwrite)

    // Add each tag to the arguments
    for (const [key, values] of Object.entries(changedTags)) {
      for (const value of values as string[]) {
        args.push("-t");
        args.push(`${key}=${value}`);
      }
    }

    // Add the file path as the last argument
    args.push(filePath);

    // The -w flag overwrites all tags, so we don't need to remove them first
    console.log("Executing vorbiscomment with args:", args);
    await execFileAsync(vorbiscommentPath, args);
    return createWriteResult(filePath, true);
  } catch (error) {
    return createWriteResult(filePath, false, error);
  }
}
