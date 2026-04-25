const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface PlateCalculatorResult {
  targetWeight: number;
  barWeight: number;
  platesPerSide: number[];
}

export function calculatePlates(
  targetWeight: number,
  barWeight = 20,
): PlateCalculatorResult {
  const platesPerSide: number[] = [];
  if (targetWeight <= barWeight) {
    return { targetWeight, barWeight, platesPerSide };
  }
  let remaining = Math.round(((targetWeight - barWeight) / 2) * 1000) / 1000;
  for (const plate of PLATES) {
    while (remaining >= plate - 0.001) {
      platesPerSide.push(plate);
      remaining = Math.round((remaining - plate) * 1000) / 1000;
    }
  }
  return { targetWeight, barWeight, platesPerSide };
}
