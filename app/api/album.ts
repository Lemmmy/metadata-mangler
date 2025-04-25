import fsp from "node:fs/promises";
import path from "node:path";
import { pathExists } from "path-exists";
import sharp from "sharp";
import * as v from "valibot";
import { publicProcedure, router } from "~/api/trpc";
import type { StoreAlbum } from "~/components/album/useMetadataStore";
import {
  getBestCoverFromSourceUrl,
  parseSupplementalDataSource,
} from "~/lib/fetch/supplementalFetch";
import { rebasePath, stripLibraryPath } from "~/lib/paths";
import {
  cleanTrackForWeb,
  getAlbumArtist,
  getAlbumCoverArt,
  getCoverArtUrl,
  getTagFromAnyTrack,
  readTracksFromDirectory,
  type WritableTags,
} from "~/lib/tags/musicMetadata";
import { writeTagsToFiles, type WriteResult } from "~/lib/tags/writeMetadata";

// Schema for validating the directory path
const directorySchema = v.object({
  path: v.pipe(v.string(), v.minLength(1)),
});

// Schema for track metadata
const trackMetadataSchema = v.object({
  filePath: v.string(),
  trackNumber: v.optional(v.number()),
  discNumber: v.optional(v.number()),
  title: v.optional(v.string()),
  artists: v.optional(v.string()),
  album: v.optional(v.string()),
  albumArtist: v.optional(v.string()),
  year: v.optional(v.string()),
  date: v.optional(v.string()),
  grouping: v.optional(v.string()),
  catalogNumber: v.optional(v.string()),
  barcode: v.optional(v.string()),
  albumSubtitle: v.optional(v.string()),
  trackComment: v.optional(v.string()),
});

export const album = router({
  // Get album metadata and tracks from a directory
  getFromDirectory: publicProcedure
    .input(directorySchema)
    .query(async ({ input }) => {
      try {
        // Read tracks from the directory with original metadata
        const tracks = await readTracksFromDirectory(rebasePath(input.path));
        const coverArt = await getAlbumCoverArt(tracks);

        return {
          album: {
            name: getTagFromAnyTrack(tracks, "album") || "Unknown Album",
            artist: getAlbumArtist(tracks) || "Unknown Artist",
            coverArt: coverArt ? await getCoverArtUrl(coverArt) : null,
            directory: stripLibraryPath(input.path),
            year: getTagFromAnyTrack(tracks, "year") || "",
            date: getTagFromAnyTrack(tracks, "date") || "",
            grouping: getTagFromAnyTrack(tracks, "grouping") || "",
            catalogNumber: getTagFromAnyTrack(tracks, "catalogNumber") || "",
            barcode: getTagFromAnyTrack(tracks, "barcode") || "",
            albumSubtitle: getTagFromAnyTrack(tracks, "albumSubtitle") || "",
          } satisfies StoreAlbum,
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
      v.strictObject({
        tracks: v.pipe(v.array(trackMetadataSchema), v.minLength(1)),
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

  // Fetch and save best cover from source URL
  fetchCoverFromSource: publicProcedure
    .input(
      v.object({
        path: v.pipe(v.string(), v.minLength(1)),
        sourceUrl: v.pipe(v.string(), v.minLength(1)),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const outPath = path.join(rebasePath(input.path), "cover.jpg");
        if (await pathExists(outPath)) {
          return { success: true, coverPath: outPath };
        }

        const source = parseSupplementalDataSource(input.sourceUrl);
        const coverUrl = await getBestCoverFromSourceUrl(
          source,
          input.sourceUrl,
        );
        if (!coverUrl) {
          return { success: false, error: "No cover image found at source" };
        }

        // Fetch the cover image
        const res = await fetch(coverUrl);
        if (!res.ok) {
          return {
            success: false,
            error: `Failed to fetch cover: ${res.status}`,
          };
        }
        const buffer = Buffer.from(await res.arrayBuffer());

        // Resize to 512x512
        const resized = await sharp(buffer)
          .resize(512, 512, { fit: "inside" })
          .toFormat("jpeg", { quality: 90 })
          .toBuffer();

        // Save as cover.jpg in the directory
        await fsp.writeFile(outPath, resized);
        return { success: true, coverArt: await getCoverArtUrl(resized) };
      } catch (error) {
        console.error("fetchCoverFromSource error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
});
