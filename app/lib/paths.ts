import path from "node:path";
import normalizePath from "normalize-path";
import { env } from "./env";
import { make400 } from "./errors";

// Normalizes and rebases a path to the simplest form within the root of the music library, unless traversal is allowed
export function rebasePath(inputPath: string): string {
  const normalizedPath = normalizePath(inputPath);

  const joined = path.join(env.MUSIC_LIBRARY_PATH, normalizedPath); // performs path.normalize internally
  if (!joined.startsWith(env.MUSIC_LIBRARY_PATH) && !env.ALLOW_TRAVERSAL) {
    throw make400("Path is outside of music library");
  }

  return joined;
}

// Strips the music library path from a path
export function stripLibraryPath(inputPath: string): string {
  const normalizedInput = normalizePath(path.resolve(inputPath));
  const normalizedLibrary = normalizePath(path.resolve(env.MUSIC_LIBRARY_PATH));

  if (!normalizedInput.startsWith(normalizedLibrary) && !env.ALLOW_TRAVERSAL) {
    throw make400("Path is outside of music library");
  }

  return normalizedInput.slice(normalizedLibrary.length).replace(/^\/+/, "");
}
