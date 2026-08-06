/**
 * Phase 5 — Redis connection management for BullMQ.
 *
 * Every BullMQ Queue / Worker / QueueEvents gets its own connection via
 * createRedisConnection(). All connections are lazy (no I/O on construction)
 * so importing this module never blocks tests or API boot.
 *
 * normalizeRedisUrl() only accepts redis:// / rediss:// URLs — Upstash REST
 * URLs (https://…) are for the HTTP cache client and are ignored here.
 */
import Redis from 'ioredis';
import { config, loadConfig } from './index';

export interface NormalizedRedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  tls: boolean;
}

export function normalizeRedisUrl(url: string | undefined): NormalizedRedisConfig | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') return null;

  const tls = parsed.protocol === 'rediss:' || config.redis.tls;
  const db = parsed.pathname && parsed.pathname.length > 1 ? parseInt(parsed.pathname.slice(1), 10) || 0 : 0;

  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 6379,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db,
    tls,
  };
}

export function createRedisConnection(): Redis {
  loadConfig();
  const normalized = normalizeRedisUrl(config.redis.url);

  const options: any = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
  };

  if (normalized) {
    options.host = normalized.host;
    options.port = normalized.port;
    if (normalized.password) options.password = normalized.password;
    options.db = normalized.db;
    if (normalized.tls) options.tls = {};
  } else if (config.redis.url) {
    // Configured but not a redis:// URL — leave host/port defaults so the
    // connection simply fails to connect rather than crashing the process.
    options.host = '127.0.0.1';
    options.port = 6379;
  } else {
    options.host = '127.0.0.1';
    options.port = 6379;
  }

  return new Redis(options);
}

/**
 * Cheap liveness probe. Never throws — returns true only when Redis is
 * actually reachable and responds to PING.
 */
export async function redisPing(timeoutMs = 1500): Promise<boolean> {
  let conn: Redis | null = null;
  try {
    conn = createRedisConnection();
    const timer = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('redis ping timeout')), timeoutMs);
    });
    const pong = await Promise.race([conn.ping(), timer]);
    return pong === 'PONG';
  } catch {
    return false;
  } finally {
    if (conn) {
      try {
        conn.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}
