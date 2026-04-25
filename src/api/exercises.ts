import client from './client';
import type { Exercise } from '../types/api';

export async function getExercises(params?: {
  page?: number;
  search?: string;
  muscleGroup?: string;
  limit?: number;
}) {
  const { data } = await client.get('/api/exercises', { params });
  return data as { data: Exercise[]; pagination: { total: number; page: number; limit: number; pages: number } };
}

export async function getSuggestedExercises(params?: { muscleGroup?: string; limit?: number }) {
  const { data } = await client.get('/api/exercises/suggested', { params });
  return data as Exercise[];
}

export async function getExerciseById(id: string) {
  const { data } = await client.get(`/api/exercises/${id}`);
  return data as Exercise;
}
