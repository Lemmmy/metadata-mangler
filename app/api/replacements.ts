import { getCollections } from "~/lib/db";
import { publicProcedure, router } from "./trpc";
import * as v from "valibot";

export const replacements = router({
  getArtistReplacements: publicProcedure
    .input(
      v.object({
        artists: v.array(v.string()),
      }),
    )
    .query(async ({ input }) => {
      const { artists } = input;
      if (!artists || artists.length === 0) return [];

      const collections = await getCollections();
      if (!collections) return [];

      const replacements = await collections.savedArtistReplacements
        .find({
          original: { $in: artists },
        })
        .toArray();
      return replacements;
    }),

  saveArtistReplacements: publicProcedure
    .input(
      v.object({
        replacements: v.array(
          v.object({
            original: v.string(),
            replacement: v.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { replacements } = input;
      const collections = await getCollections();
      if (!collections) return { success: false };

      try {
        await collections.savedArtistReplacements.bulkWrite(
          replacements.map((r) => ({
            updateOne: {
              filter: { original: r.original },
              update: { $set: { replacement: r.replacement } },
              upsert: true,
            },
          })),
        );

        return { success: true };
      } catch (error) {
        console.error("Error saving artist replacement:", error);
        return { success: false };
      }
    }),
});
