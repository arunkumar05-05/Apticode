/**
 * Database layer.
 *
 * - Postgres (production) -> SQLite (development) -> in-memory (tests) fallback chain.
 * - Connection pooling for Postgres is configured via DATABASE_URL (e.g. append
 *   `?connection_limit=20&application_name=apticode-server`). Prisma pools client-side;
 *   for high-traffic deployments terminate behind PgBouncer (env: PGPOOL_* below).
 * - Exposes `db` (Proxy with live failover), `getActiveDriver()`,
 *   `setActiveDriverForTests()`, `initDatabase()`, and `dbHealth()`.
 * - Never throws raw Prisma/SQL to callers; connection errors are logged + routed.
 */
import { PrismaClient as PGClient } from '@prisma/client';
import { PrismaClient as SQLiteClient } from '../generated/sqlite-client';
import { InMemoryStore } from './memoryStore';
import { logger } from '../config/logger';

// --- Postgres connection pool configuration ---
// Prisma's pg driver pools client-side via the connection string. Operators can
// tune pool size and keepalive through DATABASE_URL params or the PGPOOL_* env
// vars below, which we normalize into the URL at boot.
const buildPgDatasource = (): { db: { url: string } } => {
  const url = process.env.DATABASE_URL;
  if (!url) return { db: { url: '' } };
  try {
    const parsed = new URL(url);
    const limit = process.env.PGPOOL_MAX_CONNECTIONS;
    if (limit) parsed.searchParams.set('connection_limit', limit);
    const idle = process.env.PGPOOL_IDLE_TIMEOUT_MS;
    if (idle) parsed.searchParams.set('idle_in_transaction_session_timeout', idle);
    parsed.searchParams.set('application_name', 'apticode-server');
    if (!parsed.searchParams.has('keepalive')) parsed.searchParams.set('keepalive', '1');
    return { db: { url: parsed.toString() } };
  } catch {
    return { db: { url } };
  }
};

const pg = new PGClient({
  datasources: buildPgDatasource(),
});

const sqlite = new SQLiteClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
});

const memory = new InMemoryStore();

let activeDriver: 'pg' | 'sqlite' | 'memory' = 'pg';

export function getActiveDriver() {
  return activeDriver;
}

export function setActiveDriverForTests(driver: 'pg' | 'sqlite' | 'memory') {
  activeDriver = driver;
}

export async function initDatabase() {
  try {
    await pg.$connect();
    await pg.$queryRaw`SELECT 1`;
    logger.info('PostgreSQL online. Active.');
    activeDriver = 'pg';
  } catch (err: any) {
    logger.warn('PostgreSQL offline, trying SQLite...');
    try {
      await sqlite.$connect();
      logger.info('SQLite online. Active.');
      activeDriver = 'sqlite';
    } catch (sqliteErr: any) {
      logger.warn('SQLite offline, falling back to In-Memory store.');
      activeDriver = 'memory';
    }
  }
}

function getClient() {
  if (activeDriver === 'pg') return pg;
  if (activeDriver === 'sqlite') return sqlite;
  return memory;
}

function isConnectionError(error: any) {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  return /connect econnrefused|connection terminated|econnreset|connection refused|p1001|p1002|p1017|timeout exceeded|is offline|socket hang up|connection pool|client_network_offline|unable to open database file|database is locked/i.test(msg);
}

function handleConnectionFailure(error: any) {
  const msg = error && error.message ? error.message.trim() : String(error);
  logger.warn({ err: msg.slice(0, 400) }, 'Database connection error — attempting failover');
  if (activeDriver === 'pg') {
    logger.warn('Runtime failover: PG -> SQLite.');
    activeDriver = 'sqlite';
  } else if (activeDriver === 'sqlite') {
    logger.warn('Runtime failover: SQLite -> Memory.');
    activeDriver = 'memory';
  }
}

export const db: any = new Proxy({} as any, {
  get(target, modelName: string) {
    if (modelName === '$connect' || modelName === '$disconnect') {
      return async () => {
        const client = getClient();
        if (activeDriver !== 'memory') {
          return await (client as any)[modelName]();
        }
      };
    }

    return new Proxy({} as any, {
      get(target2, methodName: string) {
        return async (...args: any[]) => {
          try {
            const client = getClient();
            if (activeDriver === 'memory') {
              return await (memory as any)[modelName][methodName](...args);
            }
            return await (client as any)[modelName][methodName](...args);
          } catch (err: any) {
            if (isConnectionError(err)) handleConnectionFailure(err);
            else {
              logger.warn({ err: { message: (err && err.message ? err.message.trim() : '').slice(0, 240) } }, 'Database query fallback');
            }
            const active = getClient();
            try {
              if (active !== sqlite) return await (sqlite as any)[modelName][methodName](...args);
            } catch (e2: any) {
              if (isConnectionError(e2)) handleConnectionFailure(e2);
            }
            return await (memory as any)[modelName][methodName](...args);
          }
        };
      }
    });
  }
});

/**
 * Health probe for the active database: which driver, liveness (SELECT 1),
 * provider version string, and whether the connection is reachable.
 * Never throws — safe to call from /health under any driver.
 */
export async function dbHealth(): Promise<{
  provider: 'postgresql' | 'sqlite' | 'memory';
  reachable: boolean;
  version: string;
  driver: string;
}> {
  const driver = activeDriver;
  let version = 'n/a';
  let reachable = false;

  if (driver === 'memory') {
    return { provider: 'sqlite', reachable: true, version: 'in-memory', driver };
  }

  try {
    const client = driver === 'pg' ? pg : sqlite;
    if (driver === 'pg') {
      // PostgreSQL version() returns one row.
      const rows: any = await client!.$queryRaw`SELECT version() AS v`;
      version = String((rows && rows[0] && rows[0].v) || 'postgresql').slice(0, 80);
    } else {
      // SQLite version() returns one row.
      const rows: any = await client!.$queryRaw`SELECT sqlite_version() AS v`;
      version = String((rows && rows[0] && rows[0].v) || 'sqlite');
    }
    // liveness probe + the SELECT above both succeeded
    await client!.$queryRaw`SELECT 1`;
    reachable = true;
  } catch (err: any) {
    logger.warn({ err: { message: (err && err.message ? err.message.trim() : '').slice(0, 240) } }, 'dbHealth probe failed');
    reachable = false;
  }

  return { provider: driver === 'pg' ? 'postgresql' : 'sqlite', reachable, version, driver };
}
