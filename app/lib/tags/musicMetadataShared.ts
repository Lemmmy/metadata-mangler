export function isTagSuspicious(
  container: string,
  tagTypes: string[],
): boolean {
  if (tagTypes.length !== 1) return true;

  // TODO: Check all these values are accurate
  if (container === "FLAC" || container === "Ogg") {
    return tagTypes[0].toLowerCase() !== "vorbis";
  } else if (container === "MP3") {
    return !tagTypes[0].toLowerCase().startsWith("id3");
  }

  return false;
}
