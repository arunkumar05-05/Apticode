/**
 * Reusable Prisma / repository utilities.
 *
 * - `tx(client, fn)`: transactional helper that uses the active driver.
 * - `mapPrismaError(err)`: maps a Prisma client error into a safe, caller-friendly
 *   shape ({ status, message }) without leaking SQL. Detailed info is logged via
 *   the structured pino logger; clients only see generic messages.
 * - `prismaErrorToHttp(err)`: HTTP status mapping (P2002 unique -> 409, etc.).
 */
import { getActiveDriver } from './db';
import { logger } from '../config/logger';

type PrismaAnyClient = { $transaction: <T>(...args: any[]) => Promise<T> };

/**
 * Run a handler inside a Prisma transaction against the active driver.
 * Usage: `await tx(async (tx) => { await tx.user.create(...); ... })`.
 * Falls back gracefully if transactions aren't supported by the driver.
 */
export async function tx<T>(handler: (txClient: any) => Promise<T>): Promise<T> {
  const { db } = await import('./db'); // dynamic import to avoid cycle at module load
  const driver = getActiveDriver();
  const client = (db as any);
  if (driver === 'memory') {
    // in-memory store has no transactional semantics; run inline
    return handler(db);
  }
  try {
    const result = await (client.$transaction as any)(handler);
    return result;
  } catch (err: any) {
    logger.warn({ err: { message: err?.message } }, 'Transaction failed, rolling back');
    throw err;
  }
}

export type SafeError = { status: number; message: string; code?: string };

/**
 * Map a Prisma error (or any DB error) into a safe, client-friendly error.
 * Details are logged internally; only a generic message is returned to callers.
 */
export function mapPrismaError(err: any): SafeError {
  if (!err) return { status: 500, message: 'Unexpected database error' };

  const code = err.code;

  switch (code) {
    case 'P2000':
      return { status: 400, message: 'Invalid input: value too long for the given field.', code };
    case 'P2001':
      return { status: 404, message: 'Requested record not found.', code };
    case 'P2002':
      return { status: 409, message: 'A record with this identifier already exists.', code };
    case 'P2003':
      return { status: 400, message: 'Foreign key constraint failed.', code };
    case 'P2011':
      return { status: 400, message: 'Null constraint failed.', code };
    case 'P2012':
      return { status: 400, message: 'Missing required data.', code };
    case 'P2014':
      return { status: 409, message: 'Concurrent update conflict.', code };
    case 'P2025':
      return { status: 404, message: 'Related record not found.', code };
    default:
      // Non-Prisma or unknown error
      logger.error({ err: err }, 'Unhandled database error');
      return { status: 500, message: 'An internal error occurred while accessing the database.', code };
  }
}

/** HTTP status code mapping for Prisma errors (throws-safe wrapper). */
export function prismaErrorToHttp(err: any): number {
  return mapPrismaError(err).status;
}
