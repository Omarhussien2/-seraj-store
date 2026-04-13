import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConnection: mongoose.Connection | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * MongoDB singleton connection — prevents multiple connections in Serverless.
 * Caches the connection on `globalThis` so hot-reloads don't create new pools.
 *
 * Throws at CALL TIME (not import time) so the build works without a DB.
 */
export async function connectDB(): Promise<mongoose.Connection> {
  if (globalThis._mongooseConnection) {
    return globalThis._mongooseConnection;
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

  const { connection } = await mongoose.connect(MONGODB_URI, opts);

  connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
    globalThis._mongooseConnection = undefined;
  });

  globalThis._mongooseConnection = connection;
  console.log("MongoDB connected:", connection.host);

  return connection;
}
