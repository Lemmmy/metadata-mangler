import type {
  IAlias,
  IArtistCredit,
  IMedium,
  IRecording,
  IRelation,
  IRelease,
  ITrack,
  IWork,
} from "musicbrainz-api";

export function getMusicBrainzCatalogNumber(release: IRelease): string {
  return (
    release["label-info"]?.find((li) => li["catalog-number"])?.[
      "catalog-number"
    ] || ""
  );
}

// Interface for clean MusicBrainz data for AI inference
export interface CleanMusicBrainzAlbum {
  albumName: string;
  albumArtist: MusicBrainzAnyName[];
  discs: {
    position: number;
    tracks: {
      position: number;
      title: MusicBrainzAnyName[];
      artists?: MusicBrainzAnyName[];
      composers?: MusicBrainzAnyName[];
      arrangers?: MusicBrainzAnyName[];
      performers?: MusicBrainzAnyName[];
    }[];
  }[];
}

interface MusicBrainzTranslatedName {
  name: string;
  [locale: string]: string;
}

interface MusicBrainzRawName {
  name: string;
}

export type MusicBrainzAnyName = MusicBrainzTranslatedName | MusicBrainzRawName;

type MusicBrainzNameRel = MusicBrainzAnyName & {
  type: string;
};

function getAnyAliases(
  otherNames: string[],
  aliases: IAlias[] | undefined,
): MusicBrainzAnyName[] {
  // First, collect all names and aliases
  const allNames: MusicBrainzAnyName[] = [];

  // Add other names
  for (const name of otherNames) {
    if (name) {
      allNames.push({ name });
    }
  }

  // Add aliases if they exist
  if (aliases && aliases.length > 0) {
    for (const alias of aliases) {
      if (alias.name) {
        allNames.push({
          name: alias.name,
          [alias.locale || "noLocale"]: alias.name,
        });
      }
    }
  }

  // If no names were found, return "Unknown"
  if (allNames.length === 0) {
    return [{ name: "Unknown" }];
  }

  // Deduplicate the array deeply
  const result: MusicBrainzAnyName[] = [];
  for (const item of allNames) {
    const exists = result.some((existing) => {
      if (existing.name !== item.name) return false;

      const itemKeys = Object.keys(item);
      const existingKeys = Object.keys(existing);

      if (itemKeys.length !== existingKeys.length) return false;

      for (const key of itemKeys) {
        if (key === "name") continue; // Already checked name
        if ((item as any)[key] !== (existing as any)[key]) return false;
      }

      return true;
    });

    if (!exists) {
      result.push(item);
    }
  }

  return result;
}

export function getArtistNamesFromCredit(
  artistCredit: IArtistCredit[] | undefined,
): MusicBrainzAnyName[] {
  if (!artistCredit || artistCredit.length === 0) {
    return [{ name: "Unknown" }];
  }

  return artistCredit.flatMap((c) =>
    getAnyAliases(c.artist?.name ? [c.artist?.name] : [], c.artist?.aliases),
  );
}

export function getTrackNames(
  suppliedTitle: string | null | undefined,
  recording: IRecording | undefined,
): MusicBrainzAnyName[] {
  if (!recording) {
    return [{ name: suppliedTitle || "Unknown" }];
  }

  return getAnyAliases([recording.title], recording.aliases);
}

export function getArtistNamesFromRels(
  rels: IRelation[] | undefined,
  typeFilter: (type: string) => boolean,
): MusicBrainzNameRel[] | undefined {
  if (!rels || rels.length === 0) {
    return undefined;
  }

  const names = rels
    .filter((r) => typeFilter(r["type"]))
    .flatMap((r) =>
      getAnyAliases(
        r.artist?.name ? [r.artist?.name] : [],
        r.artist?.aliases,
      ).map((name) => ({ ...name, type: r["type"] })),
    );

  return names.length > 0 ? names : undefined;
}

export interface ITrackWithWorks extends ITrack {
  works?: IWork[];
  relations?: IRelation[];
}

export interface IMediumWithWorks extends IMedium {
  tracks: ITrackWithWorks[];
}

export interface IReleaseWithWorks extends IRelease {
  media: IMediumWithWorks[];
}

export const musicBrainzUrlPatterns = {
  musicbrainzArtist:
    /^https?:\/\/((?:www|beta)\.)?musicbrainz\.org\/artist\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
  musicbrainzRelease:
    /^https?:\/\/((?:www|beta)\.)?musicbrainz\.org\/release\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
  musicbrainzReleaseGroup:
    /^https?:\/\/((?:www|beta)\.)?musicbrainz\.org\/release-group\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
} as const;

export function parseMusicBrainzArtistUrl(url: string): string | null {
  const match = url.match(musicBrainzUrlPatterns.musicbrainzArtist);
  return match?.[1] || null;
}

export function parseMusicBrainzReleaseUrl(url: string): string | null {
  const match = url.match(musicBrainzUrlPatterns.musicbrainzRelease);
  return match?.[1] || null;
}

export function parseMusicBrainzReleaseGroupUrl(url: string): string | null {
  const match = url.match(musicBrainzUrlPatterns.musicbrainzReleaseGroup);
  return match?.[1] || null;
}

export function convertMusicBrainzArtistIdToUrl(artistId: string): string {
  return `https://musicbrainz.org/artist/${artistId}`;
}

export function convertMusicBrainzReleaseIdToUrl(releaseId: string): string {
  return `https://musicbrainz.org/release/${releaseId}`;
}

export function convertMusicBrainzReleaseGroupIdToUrl(
  releaseGroupId: string,
): string {
  return `https://musicbrainz.org/release-group/${releaseGroupId}`;
}
