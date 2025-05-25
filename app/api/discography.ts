import { ObjectId, type OptionalId } from "mongodb";
import { publicProcedure, router } from "~/api/trpc";
import { getCollections } from "~/lib/db";
import type {
  DbDiscography,
  DbDiscographyRelease,
  DbDiscographySource,
  DiscographyObtainStatus,
} from "~/lib/db";
import {
  getPreferredVgmdbName,
  parseVgmdbAlbumUrl,
  parseVgmdbArtistUrl,
} from "~/lib/fetch/vgmdbUtils";
import { parseMusicBrainzArtistUrl } from "~/lib/fetch/musicbrainzUtils";
import * as v from "valibot";
import { fetchVgmdbArtist } from "~/lib/fetch/vgmdb";

export type WebDiscography = Omit<
  DbDiscography,
  "_id" | "sources" | "releases"
> & {
  _id: string;
  sources: WebDiscographySource[];
  releases: WebDiscographyRelease[];
};

export type WebDiscographySource = Omit<
  DbDiscographySource,
  "discographyId"
> & {
  discographyId: string;
};

export type WebDiscographyRelease = Omit<
  DbDiscographyRelease,
  "_id" & "discographyId"
> & {
  _id: string;
  discographyId: string;
};

export const discography = router({
  list: publicProcedure.query(async () => {
    const collections = await getCollections();
    if (!collections) return [];

    const discographies = await collections.discographies.find().toArray();
    return discographies.map((d) => ({
      ...d,
      _id: d._id.toString(),
    }));
  }),

  create: publicProcedure
    .input(
      v.object({
        name: v.string(),
        sourceUrls: v.array(v.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const collections = await getCollections();
      if (!collections) throw new Error("Database not available");

      // Create the discography
      const result = await collections.discographies.insertOne({
        name: input.name,
        sources: [],
        releases: [],
      });

      const discographyId = result.insertedId;

      // Parse and add the new source URLs
      await processSourceUrls(input.sourceUrls, discographyId);

      return { id: discographyId.toString(), name: input.name };
    }),

  update: publicProcedure
    .input(
      v.object({
        id: v.string(),
        name: v.string(),
        sourceUrls: v.array(v.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const collections = await getCollections();
      if (!collections) throw new Error("Database not available");

      const discographyId = new ObjectId(input.id);

      // Update the discography name
      await collections.discographies.updateOne(
        { _id: discographyId },
        { $set: { name: input.name } },
      );

      // Delete existing sources
      await collections.discographySources.deleteMany({ discographyId });

      // Parse and add the new source URLs
      await processSourceUrls(input.sourceUrls, discographyId);

      return { id: discographyId.toString(), name: input.name };
    }),

  updateReleaseStatus: publicProcedure
    .input(
      v.object({
        releaseId: v.string(),
        status: v.picklist([
          "unobtained",
          "obtained_lossless",
          "obtained_lossy",
          "skipped",
        ]),
      }),
    )
    .mutation(async ({ input }) => {
      const collections = await getCollections();
      if (!collections) throw new Error("Database not available");

      const releaseId = new ObjectId(input.releaseId);
      await collections.discographyReleases.updateOne(
        { _id: releaseId },
        { $set: { status: input.status } },
      );

      return { success: true };
    }),

  mergeReleases: publicProcedure
    .input(
      v.object({
        releaseIds: v.array(v.string()),
        discographyId: v.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const collections = await getCollections();
      if (!collections) throw new Error("Database not available");

      const releaseIds = input.releaseIds.map((id: string) => new ObjectId(id));
      const discographyId = new ObjectId(input.discographyId);

      // Get all releases to merge
      const releases = await collections.discographyReleases
        .find({
          _id: { $in: releaseIds },
        })
        .toArray();

      if (releases.length < 2) {
        throw new Error("At least two releases are required for merging");
      }

      // Create merged release
      const mergedRelease: OptionalId<DbDiscographyRelease> = {
        discographyId,
        releaseDate: releases.find((r) => r.releaseDate)?.releaseDate || null,
        catalogNumber:
          releases.find((r) => r.catalogNumber)?.catalogNumber || null,
        vgmdbAlbumId:
          releases.find((r) => r.vgmdbAlbumId)?.vgmdbAlbumId || null,
        vgmdbAlbumNames:
          releases.find((r) => r.vgmdbAlbumNames)?.vgmdbAlbumNames || null,
        vgmdbRole: releases.find((r) => r.vgmdbRole)?.vgmdbRole || null,
        musicbrainzReleaseGroupId:
          releases.find((r) => r.musicbrainzReleaseGroupId)
            ?.musicbrainzReleaseGroupId || null,
        musicbrainzReleaseGroupNames:
          releases.find((r) => r.musicbrainzReleaseGroupNames)
            ?.musicbrainzReleaseGroupNames || null,
        path: releases.find((r) => r.path)?.path || null,
        status: (releases.find((r) => r.status !== "unobtained")?.status ||
          "unobtained") as DiscographyObtainStatus,
      };

      // Insert the merged release
      const result =
        await collections.discographyReleases.insertOne(mergedRelease);

      // Delete the original releases
      await collections.discographyReleases.deleteMany({
        _id: { $in: releaseIds },
      });

      return { success: true, id: result.insertedId.toString() };
    }),

  refetchDiscography: publicProcedure
    .input(
      v.object({
        id: v.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const collections = await getCollections();
      if (!collections) throw new Error("Database not available");

      const discographyId = new ObjectId(input.id);

      // Fetch all current known releases for the discography
      const releases = await collections.discographyReleases
        .find({
          discographyId,
        })
        .toArray();

      // Used for existence checking
      function makeLut(
        key: keyof DbDiscographyRelease,
        mapper = (r: DbDiscographyRelease): any => r[key],
      ) {
        return new Map(
          releases.filter((r) => !!r[key]).map((r) => [mapper(r), r._id]),
        );
      }

      const catalogLut = makeLut("catalogNumber");
      const vgmdbIdLut = makeLut("vgmdbAlbumId");
      const vgmdbAlbumNamesLut = makeLut("vgmdbAlbumNames", JSON.stringify);
      const musicBrainzIdLut = makeLut("musicbrainzReleaseGroupId");
      const musicBrainzAlbumNamesLut = makeLut(
        "musicbrainzReleaseGroupNames",
        JSON.stringify,
      );

      // Fetch all sources for the discography
      const sources = await collections.discographySources
        .find({
          discographyId,
        })
        .toArray();

      const errors: string[] = [];
      const toInsert: OptionalId<DbDiscographyRelease>[] = [];

      // Re-fetch the discographies from the sources, and merge them into the existing data. If any of our current known
      // releases have the same catalog number, or same set of titles, then ignore them. Otherwise, add the new
      // releases.
      for (const source of sources) {
        if (source.vgmdbArtistId) {
          try {
            const vgmdbArtist = await fetchVgmdbArtist(source.vgmdbArtistId);
            if (!vgmdbArtist.discography) {
              throw new Error("Artist has no discography");
            }

            // TODO: Setting for including 'featured on'? The VGMdb nomenclature for this is 'referenced on' and it
            //       mainly seems to refer to cover albums and thanks.
            for (const entry of vgmdbArtist.discography) {
              const albumId = parseVgmdbAlbumUrl(entry.link);

              if (entry.catalog && catalogLut.has(entry.catalog)) {
                continue;
              }

              if (albumId && vgmdbIdLut.has(albumId)) {
                continue;
              }

              if (
                entry.titles &&
                vgmdbAlbumNamesLut.has(JSON.stringify(entry.titles))
              ) {
                continue;
              }

              const release: OptionalId<DbDiscographyRelease> = {
                discographyId,

                releaseDate: entry.date ?? null,
                catalogNumber: entry.catalog ?? null,
                vgmdbAlbumId: albumId,
                vgmdbAlbumNames: entry.titles,
                vgmdbRole: entry.roles?.join(", ") ?? null,
                musicbrainzReleaseGroupId: null,
                musicbrainzReleaseGroupNames: null,
                path: null,
                status: "unobtained",
              };

              toInsert.push(release);
            }
          } catch (e) {
            console.error(e);
            errors.push(
              `Failed to fetch VGMdb artist for source ${source._id}: ${e}`,
            );
          }
        }

        if (source.musicBrainzArtistId) {
          try {
            throw new Error(
              "TODO: MusicBrainz artist fetching not yet implemented",
            );
          } catch (e) {
            console.error(e);
            errors.push(
              `Failed to fetch MusicBrainz artist for source ${source._id}: ${e}`,
            );
          }
        }
      }

      // Bulk insert the new releases
      if (toInsert.length > 0) {
        await collections.discographyReleases.insertMany(toInsert);
      }

      return { errors, added: toInsert.length };
    }),

  // TODO: Endpoint to auto-check MusicBee database for fetched releases
});

/**
 * Process source URLs to extract VGMdb and MusicBrainz artist IDs
 * @param urls Array of source URLs to process
 * @param discographyId The ObjectId of the discograph
 */
async function processSourceUrls(
  urls: string[],
  discographyId: ObjectId,
): Promise<void> {
  const collections = await getCollections();
  if (!collections) throw new Error("Database not available");

  const sources: DbDiscographySource[] = [];

  for (const url of urls) {
    const source: DbDiscographySource = {
      discographyId,
      vgmdbArtistId: null,
      musicBrainzArtistId: null,
    };

    source.vgmdbArtistId ||= parseVgmdbArtistUrl(url);
    source.musicBrainzArtistId ||= parseMusicBrainzArtistUrl(url);

    if (source.vgmdbArtistId || source.musicBrainzArtistId) {
      sources.push(source);
    }
  }

  if (sources.length > 0) {
    await collections.discographySources.insertMany(sources);
  }
}
