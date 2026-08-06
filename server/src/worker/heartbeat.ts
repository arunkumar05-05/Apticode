/**
 * Phase 5 — worker liveness heartbeats.
 *
 * Each worker process writes JSON under apticode:worker:heartbeat:<pid>
 * every WORKER_HEARTBEAT_INTERVAL_MS with EX WORKER_HEARTBEAT_TTL_MS.
 * Admin routes read these keys to report healthy workers; readHeartbeats
 * never throws so monitoring stays degraded-200 when Redis is down.
 */
import { config, logger } from '../config';

export interface WorkerHeartbeat {
  pid: number;
  startedAt: number;
  lastBeatAt: number;
  jobsProcessed: number;
  jobsFailed: number;
  currentJobId?: string;
  memoryRss?: number;
  judge0Name?: string;
}

export const HEARTBEAT_PREFIX = 'apticode:worker:heartbeat:';

export function heartbeatKey(pid: number): string {
  return `${HEARTBEAT_PREFIX}${pid}`;
}

export interface HeartbeatHandle {
  tickProcessed: () => void;
  tickFailed: () => void;
  setCurrentJobId: (id?: string) => void;
  stop: () => void;
}

export function startHeartbeat(
  redis: any,
  info: { judge0Name?: string }
): HeartbeatHandle {
  const pid = process.pid;
  const startedAt = Date.now();
  let jobsProcessed = 0;
  let jobsFailed = 0;
  let currentJobId: string | undefined;

  const timer = setInterval(async () => {
    try {
      const beat: WorkerHeartbeat = {
        pid,
        startedAt,
        lastBeatAt: Date.now(),
        jobsProcessed,
        jobsFailed,
        currentJobId,
        memoryRss: process.memoryUsage().rss,
        judge0Name: info.judge0Name,
      };
      await redis.set(heartbeatKey(pid), JSON.stringify(beat), 'EX', config.worker.heartbeatTtlMs);
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Heartbeat write failed');
    }
  }, config.worker.heartbeatIntervalMs);
  timer.unref();

  return {
    tickProcessed: () => { jobsProcessed += 1; },
    tickFailed: () => { jobsFailed += 1; },
    setCurrentJobId: (id?: string) => { currentJobId = id; },
    stop: () => clearInterval(timer),
  };
}

export async function readHeartbeats(redis: any): Promise<WorkerHeartbeat[]> {
  try {
    const keys: string[] = (await redis.keys(`${HEARTBEAT_PREFIX}*`)) || [];
    if (keys.length === 0) return [];
    const values: (string | null)[] = await redis.mget(keys);
    return values
      .filter((v): v is string => Boolean(v))
      .map((v) => {
        try {
          return JSON.parse(v) as WorkerHeartbeat;
        } catch {
          return null;
        }
      })
      .filter((b): b is WorkerHeartbeat => b !== null);
  } catch {
    return [];
  }
}

export function isWorkerHealthy(beat: WorkerHeartbeat, now = Date.now()): boolean {
  return now - beat.lastBeatAt < config.worker.heartbeatTtlMs * 2;
}
