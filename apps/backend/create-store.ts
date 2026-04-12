import { db, stores } from './src/db/index.js';
import { eq } from 'drizzle-orm';

async function createStore() {
  try {
    // Check if store already exists
    const existing = await db.select().from(stores).where(eq(stores.domain, 'localhost'));

    if (existing.length > 0) {
      console.log('Store already exists:', existing[0].id);
      process.exit(0);
    }

    // Create new store
    const newStore = await db.insert(stores).values({
      name: 'Test Store',
      domain: 'localhost',
      status: 'active',
      ownerEmail: 'owner@localhost.com',
      ownerName: 'Test Owner',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      surfaceColor: '#f3f4f6',
      textColor: '#111827',
      textSecondaryColor: '#6b7280',
      borderColor: '#e5e7eb',
      borderRadius: '4px',
      fontFamily: 'Space Grotesk, sans-serif',
    }).returning();

    console.log('Created store:', newStore[0].id);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  process.exit(0);
}

createStore();
