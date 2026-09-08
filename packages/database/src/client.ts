import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';

export interface DatabaseClientOptions {
  connectionString?: string;
  maxConnections?: number;
  ssl?: boolean | 'require' | 'allow' | 'prefer';
}

export function createDatabaseClient(options?: string | DatabaseClientOptions) {
  const connStr = typeof options === 'string' 
    ? options 
    : options?.connectionString || process.env.DATABASE_URL;

  if (!connStr) {
    return null;
  }

  const max = typeof options === 'object' && options?.maxConnections 
    ? options.maxConnections 
    : 10;

  // Supabase transaction pooler requires prepare: false to prevent prepared statement errors
  const isSupabasePooler = connStr.includes('pooler.supabase.com') || connStr.includes(':6543');

  const client = postgres(connStr, {
    max,
    prepare: !isSupabasePooler,
    ssl: connStr.includes('sslmode=require') || connStr.includes('supabase') ? 'require' : undefined,
    connect_timeout: 10,
    idle_timeout: 20,
  });

  return drizzle(client, { schema });
}

export async function testDatabaseConnection(db: NonNullable<ReturnType<typeof createDatabaseClient>>): Promise<boolean> {
  try {
    // Run simple query to verify connection
    await (db as any).execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

export type Database = ReturnType<typeof createDatabaseClient>;
export * from './schema';
