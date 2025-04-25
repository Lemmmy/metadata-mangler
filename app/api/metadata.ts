import { parseFile } from "music-metadata";
import path from "path";
import * as v from "valibot";
import { publicProcedure, router } from "~/api/trpc";
import type { SupplementalDataSource } from "~/lib/ai/aiMetadata";
import {
  generateImprovedMetadata,
  generateImprovedMetadataPrompt,
} from "~/lib/ai/aiMetadata";
import { estimateGenericTokenUsage } from "~/lib/ai/aiProviderGeneric";
import {
  supportedModelLut,
  supportedModelValidator,
  usageToPrice,
} from "~/lib/ai/aiProviders";
import {
  fetchCachedSupplementalData,
  parseSupplementalDataSource,
  type SupplementalData,
} from "~/lib/fetch/supplementalFetch";
import { rebasePath } from "~/lib/paths";

export const metadata = router({
  lookup: publicProcedure
    .input(
      v.strictObject({
        input: v.string(),
        albumName: v.string(),
        albumArtist: v.string(),
        tracks: v.pipe(
          v.array(
            v.object({
              directory: v.string(),
              filename: v.string(),
              trackNumber: v.number(),
              discNumber: v.number(),
              title: v.string(),
              artists: v.string(),
            }),
          ),
          v.minLength(1),
        ),
        estimateOnly: v.optional(v.boolean(), false),
        settings: v.strictObject({
          enableAI: v.boolean(),
          aiSettings: v.strictObject({
            modelId: supportedModelValidator,
            additionalInfo: v.optional(v.string()),
          }),
          inheritSupplementalFields: v.strictObject({
            year: v.boolean(),
            date: v.boolean(),
            catalogNumber: v.boolean(),
            barcode: v.boolean(),
          }),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { tracks } = input;
        const inputTracks = tracks.map(({ directory, ...t }) => ({
          ...t,
          baseDir: path.basename(directory),
        }));

        // Determine if the input is a URL or raw supplemental data
        let supplementalDataSource: SupplementalDataSource = "user";
        let supplementalData: SupplementalData = {
          cleanRaw: input.input,
          raw: input.input,
        };

        const parsedSource = parseSupplementalDataSource(input.input);
        if (parsedSource !== "user") {
          try {
            const fetched = await fetchCachedSupplementalData(
              parsedSource,
              input.input,
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

        const model = supportedModelLut[input.settings.aiSettings.modelId];

        if (input.estimateOnly) {
          const estimateFn = model.estimateUsageFn || estimateGenericTokenUsage;
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
              supplementalData.cleanRaw,
              input.settings.aiSettings.additionalInfo,
            ),
            inputTracks,
          );

          return {
            success: true,
            ...usage,
            ...usageToPrice(usage, model),
          };
        } else {
          const output = input.settings.enableAI
            ? await generateImprovedMetadata(
                model,
                input.albumName,
                input.albumArtist,
                inputTracks,
                supplementalDataSource,
                supplementalData.cleanRaw,
                input.settings.aiSettings.additionalInfo,
              )
            : undefined;

          return {
            success: true,
            albumName: output?.name || input.albumName,
            albumArtist: output?.albumArtist || input.albumArtist,
            year: input.settings.inheritSupplementalFields.year
              ? supplementalData.year
              : undefined,
            date: input.settings.inheritSupplementalFields.date
              ? supplementalData.date
              : undefined,
            catalogNumber: input.settings.inheritSupplementalFields
              .catalogNumber
              ? supplementalData.catalogNumber
              : undefined,
            barcode: input.settings.inheritSupplementalFields.barcode
              ? supplementalData.barcode
              : undefined,
            tracks: output?.tracks || [],
            ...output?.usage,
            ...usageToPrice(output?.usage, model),
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

  dump: publicProcedure
    .input(v.object({ filePath: v.string() }))
    .mutation(({ input }) =>
      parseFile(rebasePath(input.filePath), {
        duration: true,
        skipCovers: false,
      }),
    ),
});
