import { execFile } from "child_process";
import { promisify } from "util";
import { env } from "~/lib/env";
import { type WritableTags } from "./musicMetadata";
import { createWriteResult, getChangedTags } from "./writeMetadata";
import { type WriteResult } from "./writeMetadata";

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

    // Build the metaflac command arguments
    const metaflacPath = env.METAFLAC_PATH || "metaflac";
    const args: string[] = [];

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
    return createWriteResult(filePath, true);
  } catch (error) {
    return createWriteResult(filePath, false, error);
  }
}
