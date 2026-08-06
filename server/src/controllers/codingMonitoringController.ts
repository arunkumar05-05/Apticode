/**
 * Phase 5 — admin monitoring endpoints for the code-execution pipeline.
 *
 * Queue status is degraded-200: when Redis is down, getQueueMetrics returns
 * redisReachable:false with zeroed counts instead of throwing, so the admin
 * UI keeps working. Worker status reads heartbeat keys (empty when no
 * workers or Redis down).
 */
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config';
import { createRedisConnection } from '../config/redis';
import { getQueueMetrics, requeueFailedJobs } from '../queues/queueService';
import { isWorkerHealthy, readHeartbeats } from '../worker/heartbeat';

let redis: any;

function getRedis() {
  redis ??= createRedisConnection();
  return redis;
}

export async function getQueueStatus(req: AuthenticatedRequest, res: Response) {
  const metrics = await getQueueMetrics();
  res.json({ status: 'success', data: metrics });
}

export async function getWorkerStatus(req: AuthenticatedRequest, res: Response) {
  const beats = await readHeartbeats(getRedis());
  const now = Date.now();
  const workers = beats.map((b) => ({
    pid: b.pid,
    judge0: b.judge0Name || null,
    startedAt: b.startedAt,
    lastBeatAt: b.lastBeatAt,
    healthy: isWorkerHealthy(b, now),
    jobsProcessed: b.jobsProcessed,
    jobsFailed: b.jobsFailed,
    currentJobId: b.currentJobId || null,
    memoryRss: b.memoryRss || null
  }));
  res.json({
    status: 'success',
    data: {
      workers,
      config: {
        judge0Enabled: config.judge0.enabled,
        provider: config.judge0.providerOverride || 'judge0',
        pollMode: config.judge0.pollMode,
        concurrency: config.judge0.concurrency,
        maxTestcasesPerJob: config.judge0.maxTestcasesPerJob,
        maxCpuSeconds: config.judge0.maxCpuSeconds,
        maxMemoryKb: config.judge0.maxMemoryKb,
        xpRewardSubmission: config.code.xpRewardSubmission,
        heartbeatTtlMs: config.worker.heartbeatTtlMs
      }
    }
  });
}

export async function requeueFailed(req: AuthenticatedRequest, res: Response) {
  const queueName = req.body?.queueName;
  if (typeof queueName !== 'string' || !queueName) {
    return res.status(400).json({ status: 'fail', message: 'queueName is required' });
  }
  try {
    const data = await requeueFailedJobs(queueName);
    res.json({ status: 'success', data });
  } catch (err: any) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}
