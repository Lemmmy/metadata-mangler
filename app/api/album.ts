import { z } from "zod";
import { publicProcedure, router } from "~/api/trpc";
import {
  readTracksFromDirectory,
  getAlbumName,
  getAlbumArtist,
  getAlbumCoverArt,
  getCoverArtUrl,
  cleanTrackForWeb,
} from "~/lib/tags/musicMetadata";

// Schema for validating the directory path
const directorySchema = z.object({
  path: z.string().min(1),
});

export const album = router({
  // Get album metadata and tracks from a directory
  getFromDirectory: publicProcedure
    .input(directorySchema)
    .query(async ({ input }) => {
      try {
        // Read tracks from the directory with original metadata
        const tracks = await readTracksFromDirectory(input.path);

        const albumName = getAlbumName(tracks);
        const albumArtist = getAlbumArtist(tracks);
        const coverArt = getAlbumCoverArt(tracks);

        return {
          album: {
            name: albumName || "Unknown Album",
            artist: albumArtist || "Unknown Artist",
            coverArt: coverArt ? getCoverArtUrl(coverArt) : null,
            directory: input.path,
          },
          tracks: tracks.map(cleanTrackForWeb),
        };
      } catch (error) {
        console.error("Error loading album:", error);
        throw new Error("Failed to load album metadata");
      }
    }),
});
