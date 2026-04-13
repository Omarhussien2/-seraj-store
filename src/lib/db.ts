import mongoose from "mongoose";

declare global {
  // Cache the Promise — not the resolved value — to prevent duplicate connections
  // when multiple requests arrive before the first connect() resolves.
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<mongoose.Connection> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * MongoDB singleton connection — prevents multiple connections in Serverless.
 * Caches the Promise on `globalThis` so concurrent calls await the same connect.
 *
 * Throws at CALL TIME (not import time) so the build works without a DB.
 */
export async function connectDB(): Promise<mongoose.Connection> {
  if (globalThis._mongoosePromise) {
    return globalThis._mongoosePromise;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined. Add it to your .env.local file."
    );
  }

  const opts: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  globalThis._mongoosePromise = mongoose
    .connect(MONGODB_URI, opts)
    .then(({ connection }) => {
      connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
      });
      connection.on("disconnected", () => {
        console.warn("MongoDB disconnected — will reconnect on next request");
        globalThis._mongoosePromise = undefined;
      });
      console.log("MongoDB connected:", connection.host);
      return connection;
    })
    .catch((err) => {
      globalThis._mongoosePromise = undefined;
      throw err;
    });

  return globalThis._mongoosePromise;
}
