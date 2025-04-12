import path from "path";
import { z } from "zod";
import { publicProcedure, router } from "~/api/trpc";
import type { SupplementalDataSource } from "~/lib/ai/aiMetadata";
import {
  generateImprovedMetadata,
  generateImprovedMetadataPrompt,
} from "~/lib/ai/aiMetadata";
import {
  supportedModelLut,
  supportedModelValidator,
  usageToPrice,
} from "~/lib/ai/aiProviders";
import {
  fetchCachedSupplementalData,
  parseSupplementalDataSource,
} from "~/lib/fetch/supplementalFetch";

// Regex patterns for supported URLs

export const metadata = router({
  lookup: publicProcedure
    .input(
      z.object({
        input: z.string(),
        additionalInfo: z.string().optional(),
        modelId: supportedModelValidator,
        albumName: z.string(),
        albumArtist: z.string(),
        tracks: z.array(
          z.object({
            directory: z.string(),
            filename: z.string(),
            trackNumber: z.number(),
            discNumber: z.number(),
            title: z.string(),
            artists: z.string(),
          }),
        ),
        estimateOnly: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { tracks } = input;
        if (tracks.length === 0) throw new Error("No tracks provided");

        const inputTracks = input.tracks.map(({ directory, ...t }) => ({
          ...t,
          baseDir: path.basename(directory),
        }));

        // Determine if the input is a URL or raw supplemental data
        let supplementalDataSource: SupplementalDataSource = "user";
        let supplementalData = input.input;

        const parsedSource = parseSupplementalDataSource(supplementalData);
        if (parsedSource !== "user") {
          try {
            const fetched = await fetchCachedSupplementalData(
              parsedSource,
              supplementalData,
            );
            if (fetched) {
              supplementalDataSource = parsedSource;
              supplementalData = fetched;
            }
          } catch (error) {
            console.error(`Error fetching data for ${parsedSource}:`, error);
            throw new Error(`Failed to fetch data for ${parsedSource}`);
          }
        }

        const model = supportedModelLut[input.modelId];

        if (input.estimateOnly) {
          const estimateFn = model.estimateUsageFn;
          if (!estimateFn) {
            return { success: false };
          }

          const usage = await estimateFn(
            model.id,
            await generateImprovedMetadataPrompt(
              input.albumName,
              input.albumArtist,
              inputTracks,
              supplementalDataSource,
              supplementalData,
              input.additionalInfo,
            ),
            inputTracks,
          );

          return {
            success: true,
            ...usage,
            ...usageToPrice(usage, model),
          };
        } else {
          const output = await generateImprovedMetadata(
            model,
            input.albumName,
            input.albumArtist,
            inputTracks,
            supplementalDataSource,
            supplementalData,
            input.additionalInfo,
          );

          return {
            success: true,
            albumName: output.name,
            albumArtist: output.albumArtist,
            tracks: output.tracks,
            ...output.usage,
            ...usageToPrice(output.usage, model),
          };
        }
      } catch (error) {
        console.error("Error in metadata lookup:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
