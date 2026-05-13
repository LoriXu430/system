import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export type DB = DrizzleD1Database<typeof schema>;

export async function getDb(): Promise<DB> {
  const { env } = await getCloudflareContext<CloudflareEnv>();
  return drizzle(env.DB, { schema });
}
