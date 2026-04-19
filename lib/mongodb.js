import mongoose from "mongoose";
import { Resolver } from "dns/promises";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env.local file");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Resolve mongodb+srv:// URI into a direct mongodb:// URI
 * using Google DNS (8.8.8.8) — bypasses broken system DNS SRV lookup.
 */
async function resolveSrvUri(uri) {
  try {
    const url = new URL(uri);
    if (!url.protocol.startsWith("mongodb+srv")) return uri;

    const hostname = url.hostname;
    const resolver = new Resolver();
    resolver.setServers(["8.8.8.8", "8.8.4.4"]);

    // 1. Resolve SRV records → get actual host:port pairs
    const srvRecords = await resolver.resolveSrv(
      `_mongodb._tcp.${hostname}`
    );
    if (!srvRecords?.length) return uri;

    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");

    // 2. Resolve TXT record → contains replicaSet name + authSource
    let txtOpts = "authSource=admin";
    try {
      const txtRecords = await resolver.resolveTxt(hostname);
      if (txtRecords.length > 0) txtOpts = txtRecords[0].join("");
    } catch {
      // TXT record is optional — ignore failure
    }

    // 3. Build final params — merge TXT opts + original query params, no duplicates
    const finalParams = new URLSearchParams(txtOpts);
    finalParams.set("tls", "true"); // modern driver uses tls not ssl

    const origParams = new URLSearchParams(url.search);
    for (const [k, v] of origParams) {
      // skip srv-only or duplicate keys
      if (!finalParams.has(k) && k !== "appName") {
        finalParams.set(k, v);
      }
    }

    const dbName = url.pathname.replace(/^\//, "") || "wardrobe";
    const userInfo = `${url.username}:${encodeURIComponent(decodeURIComponent(url.password))}`;
    const directUri = `mongodb://${userInfo}@${hosts}/${dbName}?${finalParams.toString()}`;

    console.log("[MongoDB] SRV resolved — using direct connection");
    return directUri;
  } catch (err) {
    console.warn("[MongoDB] SRV resolve failed, falling back to original URI:", err.message);
    return uri;
  }
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = { bufferCommands: false };

    cached.promise = resolveSrvUri(MONGODB_URI)
      .then((resolvedUri) => mongoose.connect(resolvedUri, opts))
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
