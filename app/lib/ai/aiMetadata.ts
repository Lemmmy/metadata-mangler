import {
  generateObject,
  type LanguageModelUsage,
  type ProviderMetadata,
} from "ai";
import { traceAISDKModel } from "evalite/ai-sdk";
import * as v from "valibot";
import type { SupportedModel } from "./aiProviders";
import type { FileTrack } from "../tags/musicMetadata";
import { valibotSchema } from "@ai-sdk/valibot";

export type SupplementalDataSource =
  | "vgmdb"
  | "musicbrainz"
  | "bandcamp"
  | "user";

export interface ImprovedMetadataResult {
  name: string;
  albumArtist: string;
  tracks: AITrack[];
  usage?: LanguageModelUsage;
  providerMetadata?: ProviderMetadata;
}

export type AITrack = Pick<
  FileTrack,
  "filename" | "trackNumber" | "discNumber" | "title" | "artists"
> & {
  baseDir: string;
};

const TrackSchema = v.object({
  filename: v.string(),
  trackNumber: v.number(),
  discNumber: v.number(),
  title: v.string(),
  artists: v.string(),
});

const AlbumSchema = v.object({
  name: v.string(),
  albumArtist: v.string(),
  tracks: v.array(TrackSchema),
});

/**
 * Generates a prompt to generate improved metadata for tracks based on VGMDB data
 *
 * @param albumName The name of the album
 * @param albumArtist The artist of the album
 * @param tracks The original tracks with metadata from the files
 * @param supplementalDataSource The source of the supplemental data
 * @param supplementalData The supplemental data from a third-party provider, stringified
 * @param userInstructions Optional user-provided instructions
 * @returns Promise resolving to a prompt string
 */
export async function generateImprovedMetadataPrompt(
  albumName: string,
  albumArtist: string,
  tracks: AITrack[],
  supplementalDataSource: SupplementalDataSource,
  supplementalData: any,
  userInstructions?: string | null,
): Promise<string> {
  const tracksInfo = tracks.map((track) => ({
    baseDir: track.baseDir,
    filename: track.filename,
    trackNumber: track.trackNumber,
    discNumber: track.discNumber,
    title: track.title,
    artists: track.artists,
  }));

  return `
You are a music metadata expert. Your task is to improve the metadata for a set of music tracks. You have been provided
with the original track metadata, and supplemental album data from a third-party provider.

ORIGINAL ALBUM NAME: ${albumName}
ORIGINAL ALBUM ARTIST: ${albumArtist}
ORIGINAL TRACK METADATA FROM FILES:
<tracks>\n${JSON.stringify(tracksInfo, null, 2)}\n</tracks>

SUPPLEMENTAL THIRD-PARTY ALBUM INFORMATION:
${wrapSupplementalData(supplementalDataSource, supplementalData)}

${userInstructions ? `IMPORTANT USER-PROVIDED INSTRUCTIONS:\n${wrapSupplementalData("user", userInstructions)}` : ""}

Based on the third-party album information, please provide improved metadata for the album and each track.
The album name should be provided in romaji where appropriate.
A SINGLE album artist should be provided.
  - For bands and idol groups, this would be the group's name.
  - For soundtracks, this would be the primary composer.
  - For solo artists, this would be the artist's name, excluding any featured artists.
  - For rearrangement albums, this would be the primary arranger.
  - For compilations with multiple performers, you MUST use 'Various Artists'.
For each track, match it with the corresponding track based on track number and disc number.
Track titles with instrumental suffixes such as 'Instrumental', 'Karaoke', 'Off-Vocal', should be normalized to
  just ' (Instrumental)' with all other suffix punctuation cleaned up.
The track artist field should be replaced with a per-track semicolon-separated artist list in the following order:
  - Featured vocalists/performers
  - Composer
  - Arranger
  - Remixer
Lyricists and other instrumentalists should NEVER be credited, unless they are also credited as a composer, arranger,
  or performer.
NEVER duplicate an artist in the artist list.
If the supplemental information has a 'Notes' section, it should be used as the ground truth for per-track artists.
${userInstructions ? "The user's instructions should be given priority over the supplemental information." : ""}
Preserve the original filename and base directory.

ROMANIZATION RULES:
- If Japanese text was provided in the supplemental data, use it to help with romanization.
- Use the provided romaji for artist names and titles as a foundation. If no romaji is available in the supplemental
information, romanize it yourself.
- NEVER use English-translated titles directly, unless the original title is in English.
- When romanizing titles, you MUST keep English loan-words as English, NOT romaji.
- All artist names should be romanised in Japanese order (Surname Forename).
- ALWAYS use modified Hepburn romanization with kana-spelling style.
- Long vowels: ALWAYS romanize おお sounds as 'oo' and おう sounds as 'ou'.
`;
}

/**
 * AI function to generate improved metadata for tracks based on VGMDB data
 *
 * @param modelKey The key of the AI model to use
 * @param albumName The name of the album
 * @param albumArtist The artist of the album
 * @param tracks The original tracks with metadata from the files
 * @param supplementalDataSource The source of the supplemental data
 * @param supplementalData The supplemental data from a third-party provider, stringified
 * @param userInstructions Optional user-provided instructions
 * @returns Promise resolving to an array of tracks with improved metadata
 */
export async function generateImprovedMetadata(
  model: SupportedModel,
  albumName: string,
  albumArtist: string,
  tracks: AITrack[],
  supplementalDataSource: SupplementalDataSource,
  supplementalData: any,
  userInstructions?: string | null,
): Promise<ImprovedMetadataResult> {
  const languageModel = traceAISDKModel(model.provider(model.id));
  const evaluating = import.meta.env.VITE_ENV === "test";

  try {
    const { object, usage, providerMetadata } = await generateObject({
      model: languageModel,
      schema: valibotSchema(AlbumSchema),
      prompt: await generateImprovedMetadataPrompt(
        albumName,
        albumArtist,
        tracks,
        supplementalDataSource,
        supplementalData,
        userInstructions,
      ),
      temperature: 0.6,
      maxTokens: 5000,
    });

    // Validate and ensure all required fields are present
    const newTracks = object.tracks.map((improvedTrack, index) => {
      // Try to find a matching track by filename and baseDir from the original tracks
      // We need to use the original track at this index to get the baseDir and filename
      // since those aren't part of the AI-generated improvedTrack
      const originalTrack = tracks[index];
      const matchingTrack =
        tracks.find(
          (t) =>
            t.baseDir === originalTrack.baseDir &&
            t.filename === originalTrack.filename,
        ) || originalTrack; // Fall back to index-based match if not found

      return {
        ...(evaluating ? {} : matchingTrack), // Keep original data as fallback (unless evaluating)
        // Clean up semicolon-separated artist lists by removing duplicate names (but keep original order)
        title: cleanField(improvedTrack.title),
        trackNumber: cleanAnyToNumber(improvedTrack.trackNumber),
        discNumber: cleanAnyToNumber(improvedTrack.discNumber),
        artists: improvedTrack.artists
          .split(/;\s*/)
          .map(cleanField)
          .filter((artist, index, self) => self.indexOf(artist) === index)
          .join("; "),
        filename: matchingTrack.filename,
        baseDir: matchingTrack.baseDir,
      };
    });

    return {
      name: cleanField(object.name),
      albumArtist: cleanField(object.albumArtist),
      tracks: newTracks,
      usage,
      providerMetadata,
    };
  } catch (error) {
    console.error("Error generating improved metadata:", error);
    // Return original tracks if there's an error
    return evaluating
      ? { name: "", albumArtist: "", tracks: [] }
      : { name: albumName, albumArtist: albumArtist, tracks: tracks };
  }
}

const cleanField = (field: string) => field?.trim()?.replace(/[\r\n]/g, "");

const cleanAnyToNumber = (field: number | string) => {
  const number =
    typeof field === "number"
      ? field
      : parseInt(field?.trim()?.replace(/,/g, ""));
  return isNaN(number) ? 0 : number;
};

const wrapSupplementalData = (
  source: SupplementalDataSource,
  data: string,
): string =>
  `<data source="${source}">\n${typeof data === "string" ? data : JSON.stringify(data, null, 2)}\n</data>`;
