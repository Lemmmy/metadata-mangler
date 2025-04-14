import * as v from "valibot";
import { publicProcedure, router } from "~/api/trpc";
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
});
