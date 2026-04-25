export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 50;
}

export function xpProgressToNextLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = xpToLevel(xp);
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const current = xp - currentFloor;
  const needed = nextFloor - currentFloor;
  return { current, needed, percent: current / needed };
}
