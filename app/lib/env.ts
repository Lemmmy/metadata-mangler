import "dotenv/config";
import { z } from "zod";
import { zodStringBoolean, zodStringNumber } from "./utils";

export const env = z
  .object({
    OPENROUTER_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),

    DEFAULT_WEB_MODEL: z.string().default("openrouter/optimus-alpha"),
    DEFAULT_TEST_MODEL: z.string().default("openrouter/optimus-alpha"),

    MUSIC_LIBRARY_PATH: z.string(),
    TEST_ALBUM_PATH: z.string(),
    // Allow accessing paths outside of the music library
    ALLOW_TRAVERSAL: zodStringBoolean(false),
    // Maximum number of tracks to try to load in an album at once
    ALBUM_TRACK_LIMIT: zodStringNumber(512),

    VGMDB_API_URL: z.string().optional(),
    VGMDB_API_USERNAME: z.string().optional(),
    VGMDB_API_PASSWORD: z.string().optional(),

    // Tag writing utilities
    METAFLAC_PATH: z.string().optional(),
    MID3V2_PATH: z.string().optional(),
    VORBISCOMMENT_PATH: z.string().optional(),
  })
  // Require at least one API key
  .refine(
    (env) => env.OPENROUTER_API_KEY || env.ANTHROPIC_API_KEY,
    "At least one API key is required",
  )
  .parse(process.env);
