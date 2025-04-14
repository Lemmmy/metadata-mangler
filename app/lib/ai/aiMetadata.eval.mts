import { JSONDiff } from "autoevals";
import { createScorer, evalite } from "evalite";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env";
import { fetchVgmdbAlbum } from "../fetch/vgmdb";
import { containsJapaneseCharacters } from "../jp/jpUtils";
import { readTracksFromDirectory } from "../tags/musicMetadata";
import {
  generateImprovedMetadata,
  type AITrack,
  type ImprovedMetadataResult,
  type SupplementalDataSource,
} from "./aiMetadata";
import { supportedModelLut } from "./aiProviders";
import { cleanVgmdbAlbum } from "../fetch/vgmdbUtils";

type AIMetadataInput = [
  string,
  string,
  AITrack[],
  SupplementalDataSource,
  any,
  string | null | undefined,
];

type AIMetadataExpected = {
  albumName: string;
  albumArtist: string;
  tracks: Partial<AITrack>[] | undefined;
};

const metadataRequirementsScorer = createScorer<
  AIMetadataInput,
  ImprovedMetadataResult,
  AIMetadataExpected
>({
  name: "Metadata Requirements",
  description: "Checks hard requirements for the metadata.",
  scorer: ({ input, output }) => {
    const [, , inputTracks] = input;

    // Check if all tracks were processed
    if (inputTracks.length !== output.tracks.length) {
      return {
        score: 0,
        metadata: "Number of tracks in output doesn't match input",
      };
    }

    // Check if filenames were preserved
    const filenamesPreserved = output.tracks?.every(
      (t, i) => t.filename === inputTracks[i].filename,
    );
    if (!filenamesPreserved) {
      return {
        score: 0,
        metadata: "Some filenames were modified, which should be preserved",
      };
    }

    // Check that all the output tracks have titles, artists, and track numbers
    const hasRequiredFields = output.tracks?.every(
      (t) => t.title && t.artists && t.trackNumber,
    );
    if (!hasRequiredFields) {
      return {
        score: 0.25,
        metadata:
          "Some tracks are missing required fields (title, artists, track number)",
      };
    }

    // Deduct from the score if any of the tracks or artists contain Japanese characters, or forbidden terms such as
    // "off-vocal" and "karaoke"
    const lowQualityTracks = output.tracks?.filter(
      (t) =>
        t.title.match(/(off.?vocal|karaoke|inst\b)/i) ||
        containsJapaneseCharacters(t.title) ||
        containsJapaneseCharacters(t.artists),
    );
    if (lowQualityTracks.length > 0) {
      return {
        score: 1.0 - lowQualityTracks.length / output.tracks.length,
        metadata: "Some tracks contain Japanese characters or forbidden terms",
      };
    }

    return {
      score: 1.0,
      metadata: "Metadata matched expected schema",
    };
  },
});

evalite<AIMetadataInput, ImprovedMetadataResult, AIMetadataExpected>(
  "AI metadata eval",
  {
    data: async () => {
      async function vgmdbExample(
        albumName: string,
        albumArtist: string,
        trackPath: string,
        vgmdbAlbum: number,
        userInstructions?: string,
        expected?: AIMetadataExpected,
      ) {
        const tracks = await readTracksFromDirectory(trackPath);
        const vgmdbTracks = cleanVgmdbAlbum(await fetchVgmdbAlbum(vgmdbAlbum));

        // Populate missing fields from "expected" with the source data
        if (expected) {
          expected.tracks = expected.tracks?.map((track, i) => ({
            ...tracks[i],
            ...track,
          }));
        }

        return {
          input: [
            albumName,
            albumArtist,
            tracks.map((t) => ({
              ...t,
              baseDir: path.basename(t.directory),
            })),
            "vgmdb",
            vgmdbTracks,
            userInstructions || null,
          ] satisfies AIMetadataInput,
          expected,
        };
      }

      // Load test data from JSON file
      const evalDataPath = path.resolve(
        process.cwd(),
        "evalData",
        "aiMetadata-vgmdb.json",
      );
      const jsonData = await fs.readFile(evalDataPath, "utf-8");
      const testCases = JSON.parse(jsonData);

      // Process each test case
      const results = [];
      for (const testCase of testCases) {
        results.push(
          await vgmdbExample(
            testCase.albumName,
            testCase.albumArtist,
            testCase.trackPath,
            testCase.vgmdbAlbum,
            testCase.userInstructions,
            testCase.expected,
          ),
        );
      }

      return results;
    },

    task: ([
      albumName,
      albumArtist,
      tracks,
      supplementalDataSource,
      supplementalData,
      userInstructions,
    ]) =>
      generateImprovedMetadata(
        supportedModelLut[env.DEFAULT_TEST_MODEL],
        albumName,
        albumArtist,
        tracks,
        supplementalDataSource,
        supplementalData,
        userInstructions,
      ),

    scorers: [metadataRequirementsScorer, JSONDiff],

    experimental_customColumns: async (result) => {
      return [
        {
          label: "Tracks",
          value: {
            albumName: result.input[0],
            albumArtist: result.input[1],
            tracks: result.input[2].map((t) => ({
              title: t.title,
              artists: t.artists,
            })),
          },
        },
        {
          label: "Output",
          value: {
            albumName: result.output.name,
            albumArtist: result.output.albumArtist,
            tracks: result.output.tracks?.map((t) => ({
              title: t.title,
              artists: t.artists,
            })),
          },
        },
      ];
    },
  },
);
