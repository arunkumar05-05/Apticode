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
      const key = `${evt.createdAt}:${evt.status}`;
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
    setState('fallback');
    const submissionIdAtCall = submissionIdRef.current;
    if (!submissionIdAtCall) return;
    const poll = async () => {
      if (submissionIdRef.current !== submissionIdAtCall) return;
      try {
        const row = await apiFetch<{ submission?: any }>(`/coding/submissions/${submissionIdAtCall}`);
        const sub = row?.submission;
        if (sub?.status) {
          const snapshot: SubmissionStreamSnapshot = {
            status: sub.status,
            message: sub.errorMessage,
            executionMs: sub.executionMs,
            updatedAt: sub.updatedAt || new Date().toISOString(),
          };
          const key = `${snapshot.updatedAt}:${snapshot.status}`;
          if (lastEventKeyRef.current !== key) {
            lastEventKeyRef.current = key;
            setLatest(snapshot);
          }
          if (TERMINAL_STATUSES.has(snapshot.status)) {
            clearPollTimer();
            onTerminalRef.current?.(snapshot);
            return;
          }
        }
      } catch {
        clearPollTimer();
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
    setLatest(null);
    setState('connecting');
    abortRef.current = new AbortController();
    noEventTimerRef.current = setTimeout(() => {
      fallbackToPolling();
    }, NO_EVENT_FALLBACK_MS);

    void streamFetch({
      submissionId,
      signal: abortRef.current.signal,
      onEvent: handleEvent,
    }).catch(() => {
      if (abortRef.current?.signal.aborted) return;
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
      stopStream();
      clearPollTimer();
    };
  }, [clearPollTimer, stopStream]);

  return { state, latest, stop };
}
