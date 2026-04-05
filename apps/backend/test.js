import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: '../../.env' });
console.log("URL IS:", process.env.DATABASE_URL);

const sql = postgres(process.env.DATABASE_URL);

async function test() {
  try {
    await sql`SELECT 1`;
    console.log("Connection successful");
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    process.exit(0);
  }
}

test();
