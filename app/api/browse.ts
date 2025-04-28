import fsp from "node:fs/promises";
import path from "node:path";
import { env } from "~/lib/env";
import * as v from "valibot";
import { publicProcedure, router } from "~/api/trpc";
import { rebasePath } from "~/lib/paths";
import { isSupportedMusicFile } from "~/lib/tags/musicMetadata";

// Schema for path jump input validation
const pathJumpInput = v.object({
  path: v.string(),
});

export const browse = router({
  // Normalizes and validates a path for jumping to an album
  pathJump: publicProcedure.input(pathJumpInput).query(({ input }) => {
    try {
      const { path: inputPath } = input;

      // Handle client-side path roots if configured
      const clientRoots = env.CLIENT_PATH_ROOTS?.split("|") ?? [];
      for (const clientRoot of clientRoots) {
        if (inputPath.startsWith(clientRoot)) {
          // Remove the client root prefix and normalize separators
          const relativePath = inputPath
            .slice(clientRoot.length)
            .replace(/^[/\\]+/, "") // Remove leading slashes
            .replace(/\\/g, "/");
          return { success: true, path: relativePath };
        }
      }

      // If it's an absolute path, rebase it
      if (path.isAbsolute(inputPath)) {
        const rebased = rebasePath(inputPath);
        return { success: true, path: rebased };
      }

      // For relative paths, just normalize the separators
      const normalizedPath = inputPath
        .replace(/\\/g, "/")
        .replace(/^[/\\]+/, ""); // Remove leading slashes
      return { success: true, path: normalizedPath };
    } catch (error) {
      console.error("Error processing path jump:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }),

  // Checks how many valid track files are in a subdirectory before attempting to recursively open it as an album.
  // Refuses if it's greater than the limit (512 by default).
  albumPrecheck: publicProcedure
    .input(v.object({ path: v.string() }))
    .query(async ({ input }) => {
      try {
        const directoryPath = rebasePath(input.path);
        let count = 0;

        async function scanDirectory(dir: string): Promise<void> {
          if (count > env.ALBUM_TRACK_LIMIT) return;
          const entries = await fsp.readdir(dir, { withFileTypes: true });

          // Process files and directories in parallel
          const promises = entries.map(async (entry) => {
            if (count > env.ALBUM_TRACK_LIMIT) return;
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              await scanDirectory(fullPath); // Recursively scan subdirectories
            } else if (entry.isFile() && isSupportedMusicFile(fullPath)) {
              count++;
            }
          });

          // Wait for all files and subdirectories to be processed
          await Promise.all(promises);
        }

        // Start scanning from the provided directory
        await scanDirectory(directoryPath);

        return { success: count <= env.ALBUM_TRACK_LIMIT, count };
      } catch (error) {
        console.error("Error checking album files:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
});
