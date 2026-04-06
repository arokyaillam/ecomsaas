import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: resolve(fileURLToPath(import.meta.url), "../../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(DATABASE_URL);

async function migrate() {
  console.log("🔄 Running theme migration...");
  
  try {
    // Add theme columns to stores table
    await client`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0ea5e9',
      ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#6366f1',
      ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#8b5cf6',
      ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#0f172a',
      ADD COLUMN IF NOT EXISTS surface_color TEXT DEFAULT '#1e293b',
      ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#f8fafc',
      ADD COLUMN IF NOT EXISTS text_secondary_color TEXT DEFAULT '#94a3b8',
      ADD COLUMN IF NOT EXISTS border_color TEXT DEFAULT 'rgba(255,255,255,0.1)',
      ADD COLUMN IF NOT EXISTS border_radius TEXT DEFAULT '12px',
      ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter, sans-serif',
      ADD COLUMN IF NOT EXISTS logo_url TEXT,
      ADD COLUMN IF NOT EXISTS favicon_url TEXT,
      ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en'
    `;
    
    console.log("✅ Theme migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

migrate();
