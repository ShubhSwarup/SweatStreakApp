import { useMemo } from 'react';
import { calculatePlates, type PlateCalculatorResult } from '../api/plateCalculator';

export function usePlateCalc(
  targetWeight: number,
  barWeight = 20,
): PlateCalculatorResult {
  return useMemo(
    () => calculatePlates(targetWeight, barWeight),
    [targetWeight, barWeight],
  );
}
