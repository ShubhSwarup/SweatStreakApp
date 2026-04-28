import { useEffect, useRef, useState } from 'react';

/**
 * Counts up from `durationSecondsAtLoad` while `isRunning` is true.
 * Each time isRunning flips to true we snapshot the current elapsed value
 * and wall-clock so the interval resumes from where it left off, not from
 * the original server-reported duration.
 */
export function useSessionTimer(
  durationSecondsAtLoad: number,
  isRunning: boolean,
): number {
  const [elapsed, setElapsed] = useState(durationSecondsAtLoad);
  const segmentStartRef = useRef<number>(Date.now());
  const baseElapsedRef = useRef<number>(durationSecondsAtLoad);

  // When server sends a new duration (after resume / re-fetch), reset counters.
  useEffect(() => {
    baseElapsedRef.current = durationSecondsAtLoad;
    segmentStartRef.current = Date.now();
    setElapsed(durationSecondsAtLoad);
  }, [durationSecondsAtLoad]);

  // Start / stop the tick.
  useEffect(() => {
    if (!isRunning) return;

    // Snapshot elapsed at the moment this segment starts.
    baseElapsedRef.current = elapsed;
    segmentStartRef.current = Date.now();

    const id = setInterval(() => {
      const segmentSeconds = Math.floor(
        (Date.now() - segmentStartRef.current) / 1000,
      );
      setElapsed(baseElapsedRef.current + segmentSeconds);
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  return elapsed;
}

export function formatElapsed(totalSeconds: number): string {
  const t = Math.floor(totalSeconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
