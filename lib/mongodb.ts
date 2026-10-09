import "server-only";
import { MongoClient, type Db } from "mongodb";

/**
 * Shared MongoDB client. Reads MONGODB_URI (and optional MONGODB_DB) from .env.local.
 * In development the client is cached on globalThis so hot reloads don't open new pools.
 */
const globalForMongo = globalThis as unknown as { _udyogMongo?: Promise<MongoClient> };

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
  if (!globalForMongo._udyogMongo) {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000, appName: "udyog-web" });
    globalForMongo._udyogMongo = client.connect().catch((err) => {
      globalForMongo._udyogMongo = undefined; // allow a retry on the next request
      throw err;
    });
  }
  return globalForMongo._udyogMongo;
}

let indexesReady: Promise<void> | null = null;

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB || "udyog");
  if (!indexesReady) {
    const col = db.collection("applications");
    indexesReady = Promise.all([
      col.createIndex({ trackingId: 1 }, { unique: true }),
      col.createIndex({ nid: 1 }, { unique: true }),
      col.createIndex({ district: 1, upazila: 1, status: 1 }),
      col.createIndex({ submittedAt: -1 })
    ]).then(() => undefined).catch((e) => { indexesReady = null; throw e; });
  }
  await indexesReady;
  return db;
}
