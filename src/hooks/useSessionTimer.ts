import { useEffect, useRef, useState } from 'react';

export function useSessionTimer(
  durationSecondsAtLoad: number,
  isRunning: boolean,
): number {
  const tickStartRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(durationSecondsAtLoad);

  useEffect(() => {
    tickStartRef.current = Date.now();
    setElapsed(durationSecondsAtLoad);
  }, [durationSecondsAtLoad]);

  useEffect(() => {
    if (!isRunning) return;
    tickStartRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(
        durationSecondsAtLoad +
          Math.floor((Date.now() - tickStartRef.current) / 1000),
      );
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, durationSecondsAtLoad]);

  return elapsed;
}

export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
