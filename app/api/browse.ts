import fsp from "node:fs/promises";
import path from "node:path";
import { env } from "~/lib/env";
import * as v from "valibot";
import { publicProcedure, router } from "~/api/trpc";
import { rebasePath } from "~/lib/paths";
import { isSupportedMusicFile } from "~/lib/tags/musicMetadata";

export const browse = router({
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
