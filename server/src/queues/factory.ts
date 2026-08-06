/**
 * Phase 5 — queue construction.
 *
 * One BullMQ Queue instance per stage (plus DLQs), all sharing a single
 * lazy Redis connection. Connection is ioredis with lazyConnect:true, so
 * creating queues never touches the network until a job is enqueued.
 */
import { Queue } from 'bullmq';
import { config } from '../config';
import { createRedisConnection } from '../config/redis';
import { QUEUE_NAMES, QUEUE_OPTIONS } from './constants';

export interface QueueSet {
  submission: Queue;
  evaluation: Queue;
  result: Queue;
  submissionDlq: Queue;
  evaluationDlq: Queue;
  resultDlq: Queue;
}

export function createQueues(connection = createRedisConnection()): QueueSet {
  const make = (name: string, options: any) =>
    new Queue(name, {
      connection,
      prefix: config.queue.prefix,
      defaultJobOptions: options as any,
    });

  return {
    submission: make(QUEUE_NAMES.submission, QUEUE_OPTIONS.submission),
    evaluation: make(QUEUE_NAMES.evaluation, QUEUE_OPTIONS.evaluation),
    result: make(QUEUE_NAMES.result, QUEUE_OPTIONS.result),
    submissionDlq: make(QUEUE_NAMES.submissionDlq, QUEUE_OPTIONS.dlq),
    evaluationDlq: make(QUEUE_NAMES.evaluationDlq, QUEUE_OPTIONS.dlq),
    resultDlq: make(QUEUE_NAMES.resultDlq, QUEUE_OPTIONS.dlq),
  };
}
