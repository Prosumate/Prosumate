import { randomUUID } from 'crypto';
import { config } from '../config';
import { logger } from '@prosumate/logger';

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  keys(pattern?: string): Promise<string[]>;
  flush(): Promise<void>;
  hset(key: string, field: string, value: string): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hdel(key: string, field: string): Promise<void>;
}

export type EventHandler = (data: unknown) => void | Promise<void>;

export interface InternalEventBus {
  publish(channel: string, data: unknown): void;
  subscribe(channel: string, handler: EventHandler): () => void;
  unsubscribe(channel: string, handler: EventHandler): void;
}

export interface InternalJob<T = unknown> {
  id: string;
  queue: string;
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxRetries: number;
  scheduledAt: number;
  createdAt: number;
  completedAt?: number;
  failedReason?: string;
}

export interface JobQueue {
  enqueue<T = unknown>(
    queueName: string,
    data: T,
    options?: { delayMs?: number; maxRetries?: number }
  ): Promise<InternalJob<T>>;
  process<T = unknown>(queueName: string, handler: (job: InternalJob<T>) => Promise<void>): void;
  getQueueStats(queueName: string): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  listJobs(queueName: string): InternalJob[];
}

type StoredValue = { value: string; expiresAt?: number };

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^$(){}|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export class InternalEngine implements CacheClient, InternalEventBus, JobQueue {
  private readonly store = new Map<string, StoredValue>();
  private readonly hashes = new Map<string, Map<string, string>>();
  private readonly subscribers = new Map<string, Set<EventHandler>>();
  private readonly jobs: InternalJob[] = [];
  private readonly handlers = new Map<string, (job: InternalJob) => Promise<void>>();
  private readonly workerTimer: NodeJS.Timeout;
  private workerActive = false;

  constructor() {
    this.workerTimer = setInterval(() => {
      void this.runDueJobs();
    }, 25);
    this.workerTimer.unref();
  }

  private purgeExpired(key: string): void {
    const entry = this.store.get(key);
    if (entry?.expiresAt !== undefined && entry.expiresAt <= Date.now()) this.store.delete(key);
  }

  async get(key: string): Promise<string | null> {
    this.purgeExpired(key);
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds === undefined ? undefined : Date.now() + Math.max(0, ttlSeconds) * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.hashes.delete(key);
  }

  async incr(key: string): Promise<number> {
    this.purgeExpired(key);
    const existing = this.store.get(key);
    const current = Number.parseInt(existing?.value || '0', 10);
    const next = (Number.isFinite(current) ? current : 0) + 1;
    this.store.set(key, { value: String(next), expiresAt: existing?.expiresAt });
    return next;
  }

  async keys(pattern = '*'): Promise<string[]> {
    for (const key of this.store.keys()) this.purgeExpired(key);
    const matcher = globToRegExp(pattern);
    return [...new Set([...this.store.keys(), ...this.hashes.keys()])]
      .filter((key) => matcher.test(key))
      .sort();
  }

  async flush(): Promise<void> {
    this.store.clear();
    this.hashes.clear();
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    const hash = this.hashes.get(key) || new Map<string, string>();
    hash.set(field, value);
    this.hashes.set(key, hash);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.hashes.get(key)?.get(field) ?? null;
  }

  async hdel(key: string, field: string): Promise<void> {
    const hash = this.hashes.get(key);
    hash?.delete(field);
    if (hash?.size === 0) this.hashes.delete(key);
  }

  publish(channel: string, data: unknown): void {
    for (const handler of this.subscribers.get(channel) || []) {
      try {
        Promise.resolve(handler(data)).catch((error) => {
          logger.error(`[INTERNAL EVENT BUS] Handler failed on ${channel}`, error instanceof Error ? error : new Error(String(error)));
        });
      } catch (error) {
        logger.error(`[INTERNAL EVENT BUS] Handler failed on ${channel}`, error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  subscribe(channel: string, handler: EventHandler): () => void {
    const handlers = this.subscribers.get(channel) || new Set<EventHandler>();
    handlers.add(handler);
    this.subscribers.set(channel, handlers);
    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel: string, handler: EventHandler): void {
    const handlers = this.subscribers.get(channel);
    handlers?.delete(handler);
    if (handlers?.size === 0) this.subscribers.delete(channel);
  }

  async enqueue<T = unknown>(
    queueName: string,
    data: T,
    options: { delayMs?: number; maxRetries?: number } = {}
  ): Promise<InternalJob<T>> {
    const now = Date.now();
    const job: InternalJob<T> = {
      id: `job_${randomUUID()}`,
      queue: queueName,
      data,
      status: 'pending',
      attempts: 0,
      maxRetries: Math.max(0, options.maxRetries ?? 3),
      scheduledAt: now + Math.max(0, options.delayMs || 0),
      createdAt: now,
    };
    this.jobs.push(job);
    queueMicrotask(() => void this.runDueJobs());
    return job;
  }

  process<T = unknown>(queueName: string, handler: (job: InternalJob<T>) => Promise<void>): void {
    this.handlers.set(queueName, handler as (job: InternalJob) => Promise<void>);
    queueMicrotask(() => void this.runDueJobs());
  }

  private async runDueJobs(): Promise<void> {
    if (this.workerActive) return;
    this.workerActive = true;
    try {
      const now = Date.now();
      for (const job of this.jobs) {
        if (job.status !== 'pending' || job.scheduledAt > now) continue;
        const handler = this.handlers.get(job.queue);
        if (!handler) continue;
        job.status = 'processing';
        job.attempts += 1;
        try {
          await handler(job);
          job.status = 'completed';
          job.completedAt = Date.now();
          job.failedReason = undefined;
        } catch (error) {
          job.failedReason = error instanceof Error ? error.message : String(error);
          if (job.attempts <= job.maxRetries) {
            job.status = 'pending';
            job.scheduledAt = Date.now() + Math.min(30_000, 100 * (2 ** (job.attempts - 1)));
          } else {
            job.status = 'failed';
            job.completedAt = Date.now();
          }
        }
      }
    } finally {
      this.workerActive = false;
    }
  }

  listJobs(queueName: string): InternalJob[] {
    return this.jobs.filter((job) => job.queue === queueName).map((job) => ({ ...job }));
  }

  getQueueStats(queueName: string) {
    const jobs = this.jobs.filter((job) => job.queue === queueName);
    return {
      pending: jobs.filter((job) => job.status === 'pending').length,
      processing: jobs.filter((job) => job.status === 'processing').length,
      completed: jobs.filter((job) => job.status === 'completed').length,
      failed: jobs.filter((job) => job.status === 'failed').length,
      total: jobs.length,
    };
  }

  close(): void {
    clearInterval(this.workerTimer);
  }
}

export function createInternalEngine(): InternalEngine {
  if (config.redisUrl) {
    logger.warn('[INTERNAL ENGINE] REDIS_URL is ignored in internal-only mode; using the in-process engine');
  }
  return new InternalEngine();
}

export const internalEngine = createInternalEngine();
export const cache: CacheClient = internalEngine;
export const eventBus: InternalEventBus = internalEngine;
export const jobQueue: JobQueue = internalEngine;
