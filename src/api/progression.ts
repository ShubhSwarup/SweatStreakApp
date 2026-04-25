import client from './client';
import type { ProgressionData, ExerciseLastPerformance } from '../types/api';

export async function getProgression(exerciseId: string) {
  const { data } = await client.get(`/api/progression/${exerciseId}`);
  return data as { data: ProgressionData | null };
}

export async function getExerciseLastPerformance(exerciseId: string) {
  const { data } = await client.get(`/api/sessions/exercises/${exerciseId}/last-performance`);
  return data as { data: ExerciseLastPerformance | null };
}
