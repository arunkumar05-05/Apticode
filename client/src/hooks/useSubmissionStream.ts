import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, streamFetch } from '../config/api';
import type { SubmissionStreamEvent } from '../config/api';

export type SubmissionStreamState = 'idle' | 'connecting' | 'live' | 'fallback' | 'error';

export interface SubmissionStreamSnapshot {
  status: string;
  stage?: string;
  message?: string;
  executionMs?: number;
  updatedAt: string;
}

export interface UseSubmissionStreamOptions {
  submissionId?: string;
  enabled: boolean;
  onTerminal?: (snapshot: SubmissionStreamSnapshot) => void;
}

export const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'COMPILE_ERROR',
  'RUNTIME_ERROR',
  'PARTIAL',
  'SYSTEM_ERROR',
  'TIMED_OUT',
  'CANCELLED',
]);

const NO_EVENT_FALLBACK_MS = 3000;
const POLL_INTERVAL_MS = 2000;

export function useSubmissionStream({ submissionId, enabled, onTerminal }: UseSubmissionStreamOptions) {
  const [state, setState] = useState<SubmissionStreamState>('idle');
  const [latest, setLatest] = useState<SubmissionStreamSnapshot | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const activeRef = useRef(true);
  const pollingRef = useRef(false);
  const noEventTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventKeyRef = useRef<string>('');
  const submissionIdRef = useRef<string | undefined>(submissionId);
  const onTerminalRef = useRef(onTerminal);
  onTerminalRef.current = onTerminal;

  submissionIdRef.current = submissionId;

  const clearNoEventTimer = useCallback(() => {
    if (noEventTimerRef.current) {
      clearTimeout(noEventTimerRef.current);
      noEventTimerRef.current = null;
    }
  }, []);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearNoEventTimer();
  }, [clearNoEventTimer]);

  const handleEvent = useCallback(
    (evt: SubmissionStreamEvent) => {
      const key = `${evt.status}`;
      if (lastEventKeyRef.current === key) return;
      lastEventKeyRef.current = key;

      const snapshot: SubmissionStreamSnapshot = {
        status: evt.status,
        stage: evt.stage,
        message: evt.message,
        updatedAt: evt.createdAt,
      };
      setLatest(snapshot);

      if (TERMINAL_STATUSES.has(evt.status)) {
        stopStream();
        clearPollTimer();
        onTerminalRef.current?.(snapshot);
        return;
      }
      clearNoEventTimer();
      noEventTimerRef.current = setTimeout(() => {
        fallbackToPolling();
      }, NO_EVENT_FALLBACK_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearNoEventTimer, clearPollTimer, stopStream]
  );

  const fallbackToPolling = useCallback(() => {
    stopStream();
    if (pollingRef.current) return;
    pollingRef.current = true;
    setState('fallback');
    const submissionIdAtCall = submissionIdRef.current;
    if (!submissionIdAtCall) return;
    const poll = async () => {
      if (!activeRef.current) return;
      if (submissionIdRef.current !== submissionIdAtCall) return;
      try {
        const row = await apiFetch<{ submission?: any }>(`/coding/submissions/${submissionIdAtCall}`);
        if (!activeRef.current) return;
        if (submissionIdRef.current !== submissionIdAtCall) return;
        const sub = row?.submission;
        if (sub?.status) {
          const snapshot: SubmissionStreamSnapshot = {
            status: sub.status,
            message: sub.errorMessage,
            executionMs: sub.executionMs,
            updatedAt: sub.updatedAt || new Date().toISOString(),
          };
          const key = `${snapshot.status}`;
          const isTerminal = TERMINAL_STATUSES.has(snapshot.status);
          if (lastEventKeyRef.current !== key) {
            lastEventKeyRef.current = key;
            setLatest(snapshot);
            if (isTerminal) {
              clearPollTimer();
              pollingRef.current = false;
              onTerminalRef.current?.(snapshot);
              return;
            }
          } else if (isTerminal) {
            clearPollTimer();
            return;
          }
        }
      } catch {
        if (!activeRef.current) return;
        clearPollTimer();
        pollingRef.current = false;
        setState('error');
        return;
      }
      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };
    void poll();
  }, [clearPollTimer, stopStream]);

  useEffect(() => {
    if (!enabled || !submissionId) return;
    lastEventKeyRef.current = '';
    pollingRef.current = false;
    setLatest(null);
    setState('connecting');
    const controller = new AbortController();
    abortRef.current = controller;
    noEventTimerRef.current = setTimeout(() => {
      fallbackToPolling();
    }, NO_EVENT_FALLBACK_MS);

    void streamFetch({
      submissionId,
      signal: controller.signal,
      onEvent: handleEvent,
    }).catch(() => {
      if (controller.signal.aborted) return;
      if (!activeRef.current) return;
      fallbackToPolling();
    });

    return () => {
      stopStream();
      clearPollTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, enabled]);

  const stop = useCallback(() => {
    stopStream();
    clearPollTimer();
    setState('idle');
  }, [clearPollTimer, stopStream]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      stopStream();
      clearPollTimer();
    };
  }, [clearPollTimer, stopStream]);

  return { state, latest, stop };
}
