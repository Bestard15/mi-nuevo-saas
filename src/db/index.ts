import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// postgres-js connects lazily on first query, so importing this module at
// build time (e.g. from auth.ts) is safe without a live database.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/echoboard";

declare global {
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

// Reuse the client across HMR reloads in development to avoid exhausting
// database connections.
const client = globalThis.__dbClient ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") globalThis.__dbClient = client;

export const db = drizzle(client, { schema });
export { schema };
