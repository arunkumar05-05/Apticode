import { PrismaClient as PGClient } from '@prisma/client';
import { PrismaClient as SQLiteClient } from '../generated/sqlite-client';
import { InMemoryStore } from './memoryStore';

const pg = new PGClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const sqlite = new SQLiteClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

const memory = new InMemoryStore();

let activeDriver: 'pg' | 'sqlite' | 'memory' = 'pg';

export function getActiveDriver() {
  return activeDriver;
}

export async function initDatabase() {
  try {
    await pg.$connect();
    await pg.$queryRaw`SELECT 1`;
    console.log('[Database] PostgreSQL online. Active.');
    activeDriver = 'pg';
  } catch (err: any) {
    console.warn('[Database] PostgreSQL offline, trying SQLite...');
    try {
      await sqlite.$connect();
      console.log('[Database] SQLite online. Active.');
      activeDriver = 'sqlite';
    } catch (sqliteErr: any) {
      console.warn('[Database] SQLite offline, falling back to In-Memory store.');
      activeDriver = 'memory';
    }
  }
}

function getClient() {
  if (activeDriver === 'pg') return pg;
  if (activeDriver === 'sqlite') return sqlite;
  return memory;
}

function handleConnectionFailure(error: any) {
  console.warn('[Database] Connection error encountered:', error.message);
  if (activeDriver === 'pg') {
    console.warn('[Database] Runtime failover: PG -> SQLite.');
    activeDriver = 'sqlite';
  } else if (activeDriver === 'sqlite') {
    console.warn('[Database] Runtime failover: SQLite -> Memory.');
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
            handleConnectionFailure(err);
            const client = getClient();
            if (activeDriver === 'memory') {
              return await (memory as any)[modelName][methodName](...args);
            }
            return await (client as any)[modelName][methodName](...args);
          }
        };
      }
    });
  }
});
