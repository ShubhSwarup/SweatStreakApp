import client from './client';
import type { WorkoutPlan, TodayPlan, CreatePlanPayload } from '../types/api';

export async function getPlans(): Promise<WorkoutPlan[]> {
  const { data } = await client.get('/api/workoutPlan');
  return data.data;
}

export async function getPlanById(planId: string): Promise<WorkoutPlan> {
  const { data } = await client.get(`/api/workoutPlan/${planId}`);
  return data.data;
}

export async function getActivePlan(): Promise<WorkoutPlan | null> {
  const { data } = await client.get('/api/workoutPlan/active');
  return data.data;
}

export async function getTodayPlan(): Promise<TodayPlan | null> {
  const { data } = await client.get('/api/workoutPlan/today');
  return data.data;
}

export async function createPlan(payload: CreatePlanPayload): Promise<WorkoutPlan> {
  const { data } = await client.post('/api/workoutPlan', payload);
  return data.data;
}

export async function updatePlan(planId: string, payload: CreatePlanPayload): Promise<WorkoutPlan> {
  const { data } = await client.patch(`/api/workoutPlan/${planId}`, payload);
  return data.data;
}

export async function activatePlan(planId: string): Promise<WorkoutPlan> {
  const { data } = await client.post(`/api/workoutPlan/${planId}/activate`);
  return data.data;
}

export async function duplicatePlan(planId: string): Promise<WorkoutPlan> {
  const { data } = await client.post(`/api/workoutPlan/${planId}/duplicate`);
  return data.data;
}

export async function deletePlan(planId: string): Promise<void> {
  await client.delete(`/api/workoutPlan/${planId}`);
}

export async function skipDay(): Promise<WorkoutPlan> {
  const { data } = await client.post('/api/workoutPlan/skip');
  return data.data;
}

export async function restartPlan(): Promise<WorkoutPlan> {
  const { data } = await client.post('/api/workoutPlan/restart');
  return data.data;
}
