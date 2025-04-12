import { z } from "zod";
import { publicProcedure, router } from "~/api/trpc";
import { rebasePath, stripLibraryPath } from "~/lib/paths";
import {
  readTracksFromDirectory,
  getAlbumName,
  getAlbumArtist,
  getAlbumCoverArt,
  getCoverArtUrl,
  cleanTrackForWeb,
  type WritableTags,
} from "~/lib/tags/musicMetadata";
import { writeTagsToFiles, type WriteResult } from "~/lib/tags/writeMetadata";

// Schema for validating the directory path
const directorySchema = z.object({
  path: z.string().min(1),
});

// Schema for track metadata
const trackMetadataSchema = z.object({
  filePath: z.string(),
  trackNumber: z.number().optional(),
  discNumber: z.number().optional(),
  title: z.string().optional(),
  artists: z.string().optional(),
  album: z.string().optional(),
  albumArtist: z.string().optional(),
});

export const album = router({
  // Get album metadata and tracks from a directory
  getFromDirectory: publicProcedure
    .input(directorySchema)
    .query(async ({ input }) => {
      try {
        // Read tracks from the directory with original metadata
        const tracks = await readTracksFromDirectory(rebasePath(input.path));

        const albumName = getAlbumName(tracks);
        const albumArtist = getAlbumArtist(tracks);
        const coverArt = getAlbumCoverArt(tracks);

        return {
          album: {
            name: albumName || "Unknown Album",
            artist: albumArtist || "Unknown Artist",
            coverArt: coverArt ? getCoverArtUrl(coverArt) : null,
            directory: stripLibraryPath(input.path),
          },
          tracks: tracks.map(cleanTrackForWeb),
        };
      } catch (error) {
        console.error("Error loading album:", error);
        throw new Error("Failed to load album metadata");
      }
    }),

  // Write metadata to album tracks
  writeTracks: publicProcedure
    .input(
      z.object({
        tracks: z.array(trackMetadataSchema),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Extract file paths and tags from input tracks
        const filePaths: string[] = [];
        const tagsList: Partial<WritableTags>[] = [];

        input.tracks.forEach((track) => {
          const { filePath, ...tags } = track;
          filePaths.push(rebasePath(filePath));
          tagsList.push(tags as Partial<WritableTags>);
        });

        // Write the metadata to the files
        const results = await writeTagsToFiles(filePaths, tagsList);

        // Check if all writes were successful
        const allSuccessful = results.every(
          (result: WriteResult) => result.success,
        );

        // Get any error messages
        const errors = results
          .filter((result: WriteResult) => !result.success && result.error)
          .map(
            (result: WriteResult) =>
              `${stripLibraryPath(result.filePath)}: ${result.error}`,
          );

        return {
          success: allSuccessful,
          results,
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (error) {
        console.error("Error writing track metadata:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
});
