import { config } from '../config';
import { logger } from '@prosumate/logger';

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
}

class InMemoryCacheClient implements CacheClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const count = (parseInt(current || '0', 10) || 0) + 1;
    await this.set(key, count.toString());
    return count;
  }
}

export function createCacheClient(): CacheClient {
  if (config.redisUrl) {
    logger.info(`[CACHE] Redis configured with URL: ${config.redisUrl.replace(/:[^:@]+@/, ':***@')}`);
  } else {
    logger.info('[CACHE] Using in-memory fallback cache (Free test phase)');
  }
  return new InMemoryCacheClient();
}

export const cache = createCacheClient();
