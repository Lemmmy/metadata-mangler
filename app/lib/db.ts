import { Db, MongoClient, ObjectId, type OptionalId } from "mongodb";
import { env } from "./env";
import type { VgmdbNames } from "./fetch/vgmdb";
import type { MusicBrainzAnyName } from "./fetch/musicbrainzUtils";

let client: MongoClient | null = null;

export interface DbSavedArtistReplacement {
  id: string;
  original: string;
  replacement: string;
}

export interface DbDiscography {
  _id: ObjectId;
  name: string; // user-specified name
  sources: DbDiscographySource[]; // relation
  releases: DbDiscographyRelease[]; // relation
}

export interface DbDiscographySource {
  discographyId: ObjectId;

  vgmdbArtistId: number | null;
  musicBrainzArtistId: string | null;
}

export type DiscographyObtainStatus =
  | "unobtained"
  | "obtained_lossless"
  | "obtained_lossy"
  | "skipped";

export interface DbDiscographyRelease {
  _id: ObjectId;
  discographyId: ObjectId;

  releaseDate: string | null;
  catalogNumber: string | null;
  vgmdbAlbumId: number | null;
  vgmdbAlbumNames: VgmdbNames | null;
  vgmdbRole: string | null;
  musicbrainzReleaseGroupId: string | null;
  musicbrainzReleaseGroupNames: MusicBrainzAnyName[] | null;

  // If the album is obtained, its path relative to the music library root
  path: string | null;
  // User-specified status of the album
  status: DiscographyObtainStatus;
}

export function getMongoClient(): MongoClient | null {
  if (!env.MONGO_URI) return null;
  return (client ||= new MongoClient(env.MONGO_URI));
}

export function getDb(): Db | null {
  return getMongoClient()?.db(env.MONGO_DB) || null;
}

export async function getCollections() {
  const db = getDb();
  if (!db) return null;

  const savedArtistReplacements = db.collection<DbSavedArtistReplacement>(
    "savedArtistReplacements",
  );
  await savedArtistReplacements.createIndex({ original: 1 }, { unique: true });

  const discographies =
    db.collection<OptionalId<DbDiscography>>("discographies");
  await discographies.createIndex({ name: 1 }, { unique: true });

  const discographySources =
    db.collection<DbDiscographySource>("discographySources");
  await discographySources.createIndex({ discographyId: 1 });

  const discographyReleases = db.collection<OptionalId<DbDiscographyRelease>>(
    "discographyReleases",
  );
  await discographyReleases.createIndex({ discographyId: 1 });

  return {
    savedArtistReplacements,
    discographies,
    discographySources,
    discographyReleases,
  };
}

export async function closeMongoClient() {
  await client?.close();
  client = null;
}

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.once(signal, () => closeMongoClient().catch(console.error));
});
