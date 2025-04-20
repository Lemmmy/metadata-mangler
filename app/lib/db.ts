import { Db, MongoClient } from "mongodb";
import { env } from "./env";

let client: MongoClient | null = null;

export interface DbSavedArtistReplacement {
  id: string;
  original: string;
  replacement: string;
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

  return { savedArtistReplacements };
}

export async function closeMongoClient() {
  await client?.close();
  client = null;
}

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.once(signal, () => closeMongoClient().catch(console.error));
});
