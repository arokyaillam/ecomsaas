import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

// Load the root .env manually
dotenv.config({ path: resolve(fileURLToPath(import.meta.url), "../../../../../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Create a single postgres client
const client = postgres(connectionString);

// Export the drizzle instance and the schema
export const db = drizzle(client, { schema });
export * from "./schema.js";
