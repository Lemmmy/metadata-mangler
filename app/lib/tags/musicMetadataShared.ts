import type { IAudioMetadata } from "music-metadata";

export function isTagSuspicious(
  container: string,
  tagTypes: string[],
): boolean {
  // TODO: Check all these values are accurate
  if (container === "FLAC" || container === "Ogg") {
    return tagTypes[0]?.toLowerCase() !== "vorbis";
  } else if (container === "MPEG" || container === "MP3") {
    // Require an ID3v2 tag at the very least. There is likely also going to be an ID3v2 tag at the end, but we don't
    // care about that.
    return !tagTypes.some((tagType) =>
      tagType.toLowerCase().startsWith("id3v2"),
    );
  }

  return false;
}

export function toJoinedString(
  value: string | string[] | undefined,
  separator: string,
): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(separator);
  return "";
}

export const toSemicolonString = (
  value: string | string[] | undefined,
): string => toJoinedString(value, "; ");

export const fromSemicolonString = (value: string): string[] =>
  value
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

export function findNativeStringTag(
  tags: IAudioMetadata["native"],
  targetTag: string,
): string | undefined {
  const out: string[] = [];

  for (const format in tags) {
    if (!Object.prototype.hasOwnProperty.call(tags, format)) continue;

    for (const tag of tags[format]) {
      const targetId = format.startsWith("ID3v2")
        ? `TXXX:${targetTag}`
        : targetTag;

      if (tag.id === targetId) {
        if (typeof tag.value === "string") {
          out.push(tag.value);
        } else if (Array.isArray(tag.value)) {
          out.push(...tag.value);
        } else {
          console.warn("Invalid tag value type:", tag.id, tag.value);
        }
      }
    }
  }

  return out.length > 0 ? out.join("; ") : undefined;
}
