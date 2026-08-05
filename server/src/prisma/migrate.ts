/**
 * Lightweight migration-status probe for the /health endpoint.
 *
 * Reads the Prisma `_prisma_migrations` table (if present) to report the
 * latest applied migration and count. Never throws — tables may not exist
 * on a fresh SQLite dev DB or an in-memory test store.
 */
import { db } from './db';

export async function migrationStatusCheck(): Promise<{
  lastApplied?: string;
  appliedCount?: number;
  error?: string;
}> {
  try {
    // _prisma_migrations exists only after `prisma migrate` has been run.
    const row: any = await db.$queryRawUnsafe<any>`
      SELECT COALESCE(MAX("version"), '') AS latest, COUNT(*) AS cnt
      FROM "_prisma_migrations"
    `;
    if (!row) return { error: 'no migration metadata table' };
    const latest = row.latest ? String(row.latest) : undefined;
    const cnt = Number(row.cnt);
    if (!latest) return { error: 'no migrations applied yet' };
    return { lastApplied: latest, appliedCount: cnt };
  } catch (err: any) {
    // Table doesn't exist on a fresh/in-memory DB — not an error, just report it.
    return { error: 'migration metadata table not present' };
  }
}
