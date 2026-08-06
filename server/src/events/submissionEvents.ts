/**
 * Phase 5 — realtime submission status events.
 *
 * Redis pub/sub bridge between the async grading pipeline (workers) and the
 * SSE stream endpoints (API). Publishing is fire-and-forget and never throws
 * — a Redis outage must not break grading. The subscriber is a lazy singleton
 * on its own dedicated connection; the client registry fans events out to
 * matching SSE responses with a per-user cap and write backpressure.
 */
import Redis from 'ioredis';
import type { Response } from 'express';
import { config, logger } from '../config';
import { createRedisConnection } from '../config/redis';
import { formatSseEvent } from '../controllers/submissionStreamController';

export const SUBMISSION_EVENTS_CHANNEL = 'apticode:submission-events';

export interface SubmissionEvent {
  type: 'SUBMISSION_UPDATED';
  submissionId: string;
  userId: string;
  status: string;
  stage?: string;
  message?: string;
  xpAwarded?: number;
  createdAt: string;
}

export type SubmissionEventHandler = (evt: SubmissionEvent) => void;

const PUBLISH_TIMEOUT_MS = 500;
const HEARTBEAT_FRAME = ': ping\n\n';
const MAX_CLIENTS_PER_USER = 5;
const MAX_WRITE_BUFFER_BYTES = 64 * 1024;

// ---------------------------------------------------------------- *
// Publishing (used by workers — fire-and-forget, never throws)
// ---------------------------------------------------------------- *

export async function publishSubmissionEvent(evt: SubmissionEvent): Promise<boolean> {
  let conn: Redis | null = null;
  let timedOut = false;
  try {
    conn = createRedisConnection();
    conn.on('error', () => {
      // Swallow connection-level errors; the guard below reports the outcome.
    });
    const guard = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        timedOut = true;
        reject(new Error('publish timed out'));
      }, PUBLISH_TIMEOUT_MS);
      timer.unref?.();
    });
    await Promise.race([conn.publish(SUBMISSION_EVENTS_CHANNEL, JSON.stringify(evt)), guard]);
    return true;
  } catch (err: any) {
    logger.warn({ err: err?.message, submissionId: evt.submissionId }, 'Submission event publish failed');
    return false;
  } finally {
    if (conn) {
      if (timedOut || conn.status !== 'ready') {
        conn.disconnect();
      } else {
        conn.quit().catch(() => {});
      }
    }
  }
}

// ---------------------------------------------------------------- *
// Subscriber (lazy singleton, used by the API process)
// ---------------------------------------------------------------- *

let subscriberConn: Redis | null = null;
let subscriberHandler: SubmissionEventHandler | null = null;
let subscriberStarted = false;

export async function subscribeSubmissionEvents(handler: SubmissionEventHandler): Promise<void> {
  subscriberHandler = handler;
  subscriberStarted = true;
  if (subscriberConn) return;
  try {
    const conn = createRedisConnection();
    conn.on('error', () => {
      // Connection-level errors are handled by ioredis's retry strategy;
      // resubscription happens automatically on reconnect.
    });
    conn.on('message', (channel, message) => {
      if (channel !== SUBMISSION_EVENTS_CHANNEL) return;
      try {
        const evt = JSON.parse(message) as SubmissionEvent;
        subscriberHandler?.(evt);
      } catch (err: any) {
        logger.warn({ err: err?.message }, 'Invalid submission event on channel');
      }
    });
    subscriberConn = conn;
    await conn.subscribe(SUBMISSION_EVENTS_CHANNEL);
    logger.info('Submission event subscriber connected');
  } catch (err: any) {
    subscriberConn = null;
    logger.warn({ err: err?.message }, 'Submission event subscriber failed to connect');
  }
}

export async function closeSubmissionSubscriber(): Promise<void> {
  const conn = subscriberConn;
  subscriberConn = null;
  subscriberHandler = null;
  subscriberStarted = false;
  if (!conn) return;
  try {
    conn.stream?.unref?.();
    await conn.quit().catch(() => {});
  } catch {
    // Already closed.
  }
}

export function isSubmissionSubscriberActive(): boolean {
  return subscriberStarted && subscriberConn !== null;
}

// ---------------------------------------------------------------- *
// Client registry (per-process fan-out to SSE responses)
// ---------------------------------------------------------------- *

interface StreamClient {
  id: string;
  userId: string;
  submissionId?: string;
  res: Response;
}

let streamClients: StreamClient[] = [];
let streamClientSeq = 0;
let heartbeatTimer: NodeJS.Timeout | null = null;

export function registerStreamClient(opts: { userId: string; submissionId?: string; res: Response }): string {
  const client: StreamClient = {
    id: `sse-${process.pid}-${++streamClientSeq}`,
    userId: opts.userId,
    submissionId: opts.submissionId,
    res: opts.res,
  };
  pruneDeadClients();
  const sameUser = streamClients.filter((c) => c.userId === client.userId);
  if (sameUser.length >= MAX_CLIENTS_PER_USER) {
    const oldest = sameUser[0];
    logger.warn({ userId: client.userId, clientId: oldest.id }, 'Stream client cap reached; dropping oldest');
    oldest.res.destroy();
    streamClients = streamClients.filter((c) => c.id !== oldest.id);
  }
  streamClients.push(client);
  ensureHeartbeat();
  return client.id;
}

export function getStreamClientCount(): number {
  pruneDeadClients();
  return streamClients.length;
}

function emitToClient(client: StreamClient, frame: string): boolean {
  if (client.res.writableEnded || client.res.destroyed) return false;
  try {
    client.res.write(frame);
    client.res.flush?.();
  } catch {
    return false;
  }
  if (client.res.writableLength > MAX_WRITE_BUFFER_BYTES) {
    logger.warn({ clientId: client.id }, 'Stream client backpressure exceeded; dropping');
    client.res.destroy();
    return false;
  }
  return true;
}

function pruneDeadClients(): void {
  streamClients = streamClients.filter((c) => !c.res.writableEnded && !c.res.destroyed);
}

function ensureHeartbeat(): void {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    if (streamClients.length === 0) return;
    const live: StreamClient[] = [];
    for (const client of streamClients) {
      if (emitToClient(client, HEARTBEAT_FRAME)) live.push(client);
    }
    streamClients = live;
    if (streamClients.length === 0) stopHeartbeat();
  }, config.sse.heartbeatIntervalMs);
  heartbeatTimer.unref?.();
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// Fan-out entry point invoked by the subscriber.
export function dispatchSubmissionEvent(evt: SubmissionEvent): void {
  const live: StreamClient[] = [];
  for (const client of streamClients) {
    if (client.res.writableEnded || client.res.destroyed) continue;
    if (client.userId !== evt.userId) {
      live.push(client);
      continue;
    }
    if (client.submissionId && client.submissionId !== evt.submissionId) {
      live.push(client);
      continue;
    }
    if (emitToClient(client, formatSseEvent(evt))) live.push(client);
  }
  streamClients = live;
}
