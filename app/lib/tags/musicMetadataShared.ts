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
