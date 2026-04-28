export function formatSeconds(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds);
  if (s < 3600) return formatSeconds(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}
