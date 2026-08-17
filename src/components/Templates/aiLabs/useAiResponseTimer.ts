import { useEffect, useRef, useState } from 'react';

export type AiRunStatus = 'idle' | 'running' | 'complete' | 'stopped';

export type AiRunTiming = {
  status: AiRunStatus;
  elapsedMs: number;
};

const EMPTY_TIMING: AiRunTiming = { status: 'idle', elapsedMs: 0 };

function readTiming(storageKey: string): AiRunTiming {
  if (!storageKey) return EMPTY_TIMING;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null') as Partial<AiRunTiming> | null;
    if (!stored || !Number.isFinite(stored.elapsedMs)) return EMPTY_TIMING;
    const status = stored.status === 'complete' || stored.status === 'stopped' ? stored.status : 'idle';
    return { status, elapsedMs: Math.max(0, Number(stored.elapsedMs)) };
  } catch {
    return EMPTY_TIMING;
  }
}

export function formatAiElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, elapsedMs) / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function useAiResponseTimer(
  isRunning: boolean,
  output: unknown,
  storageKey: string,
): AiRunTiming {
  const [timing, setTiming] = useState<AiRunTiming>(() => readTiming(storageKey));
  const wasRunningRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const outputAtStartRef = useRef<unknown>(null);

  useEffect(() => {
    if (!isRunning) setTiming(readTiming(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const wasRunning = wasRunningRef.current;

    if (isRunning && !wasRunning) {
      startedAtRef.current = Date.now();
      outputAtStartRef.current = output;
      setTiming({ status: 'running', elapsedMs: 0 });
    } else if (!isRunning && wasRunning && startedAtRef.current != null) {
      const elapsedMs = Date.now() - startedAtRef.current;
      const receivedNewOutput = output != null && output !== outputAtStartRef.current;
      const finalTiming: AiRunTiming = {
        status: receivedNewOutput ? 'complete' : 'stopped',
        elapsedMs,
      };
      setTiming(finalTiming);
      try {
        localStorage.setItem(storageKey, JSON.stringify(finalTiming));
      } catch {
        // Timing is display-only; storage failure must never affect an AI run.
      }
      startedAtRef.current = null;
    }

    wasRunningRef.current = isRunning;
  }, [isRunning, output, storageKey]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(() => {
      if (startedAtRef.current == null) return;
      setTiming({ status: 'running', elapsedMs: Date.now() - startedAtRef.current });
    }, 100);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  return timing;
}
