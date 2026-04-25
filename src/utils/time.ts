export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 3600) return formatSeconds(seconds);
  const h = Math.floor(seconds / 3600);
  const remaining = seconds % 3600;
  return `${h}h ${formatSeconds(remaining)}`;
}
