import "dotenv/config";
import * as v from "valibot";
import { vStringBoolean, vStringNumber } from "./utils";

export const env = v.parse(
  v.pipe(
    v.object({
      // Music library
      MUSIC_LIBRARY_PATH: v.string(),
      // Allow accessing paths outside of the music library
      ALLOW_TRAVERSAL: vStringBoolean(false),
      // Maximum number of tracks to try to load in an album at once
      ALBUM_TRACK_LIMIT: vStringNumber(512),

      // Database
      MONGO_URI: v.optional(v.string()),
      MONGO_DB: v.optional(
        v.string(),
        process.env.NODE_ENV === "production"
          ? "metadata-mangler"
          : "metadata-mangler-dev",
      ),

      // AI providers
      OPENROUTER_API_KEY: v.optional(v.string()),
      ANTHROPIC_API_KEY: v.optional(v.string()),
      OPENAI_API_KEY: v.optional(v.string()),

      DEFAULT_WEB_MODEL: v.optional(
        v.string(),
        "google/gemini-2.0-flash-exp:free",
      ),
      DEFAULT_TEST_MODEL: v.optional(
        v.string(),
        "google/gemini-2.0-flash-exp:free",
      ),

      // Tag providers
      VGMDB_API_URL: v.optional(v.string()),
      VGMDB_API_USERNAME: v.optional(v.string()),
      VGMDB_API_PASSWORD: v.optional(v.string()),

      // Tag writing utilities (will fallback to $PATH if not specified)
      METAFLAC_PATH: v.optional(v.string()),
      MID3V2_PATH: v.optional(v.string()),
      VORBISCOMMENT_PATH: v.optional(v.string()),
    }),
    // Require at least one API key
    v.check(
      (env) =>
        !!(
          env.OPENROUTER_API_KEY ||
          env.ANTHROPIC_API_KEY ||
          env.OPENAI_API_KEY
        ),
      "At least one API key is required",
    ),
  ),
  process.env,
);
