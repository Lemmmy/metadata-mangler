import * as v from "valibot";
import { publicProcedure, router } from "~/api/trpc";
import {
  getMusicBrainzRelease,
  searchMusicBrainzRecordings,
  searchMusicBrainzReleases,
} from "~/lib/fetch/musicbrainz";
import { fetchVgmdbAlbum, searchVgmdbAlbums } from "~/lib/fetch/vgmdb";

export const search = router({
  // Searches VGMdb for an album and returns the results
  vgmdb: publicProcedure
    .input(v.object({ albumName: v.string() }))
    .query(async ({ input }) => {
      return await searchVgmdbAlbums(input.albumName);
    }),

  // Looks up an album on VGMdb
  vgmdbDetails: publicProcedure
    .input(v.object({ albumId: v.number() }))
    .query(async ({ input }) => {
      return await fetchVgmdbAlbum(input.albumId);
    }),

  // Searches MusicBrainz for releases
  musicBrainzReleases: publicProcedure
    .input(
      v.object({
        query: v.string(),
        artistFilter: v.optional(v.string()),
      }),
    )
    .query(async ({ input }) => {
      return await searchMusicBrainzReleases(input.query, input.artistFilter);
    }),

  // Searches MusicBrainz for recordings and returns associated releases
  musicBrainzRecordings: publicProcedure
    .input(
      v.object({
        query: v.string(),
        artistFilter: v.optional(v.string()),
      }),
    )
    .query(async ({ input }) => {
      return await searchMusicBrainzRecordings(input.query, input.artistFilter);
    }),

  // Looks up a release on MusicBrainz by ID
  musicBrainzRelease: publicProcedure
    .input(v.object({ releaseId: v.string() }))
    .query(async ({ input }) => {
      return await getMusicBrainzRelease(input.releaseId);
    }),
});
