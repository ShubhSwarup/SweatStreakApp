import client from './client';
import type { ActiveSession, FinishSessionResult, LogSetResult } from '../types/api';

export async function getActiveSession(): Promise<ActiveSession | null> {
  const { data } = await client.get('/api/sessions/active');
  return data.data as ActiveSession | null;
}

export async function startSession(payload: {
  name?: string;
  template?: string;
}): Promise<{ session: ActiveSession; isExisting: boolean }> {
  const { data } = await client.post('/api/sessions/start', payload);
  return data.data as { session: ActiveSession; isExisting: boolean };
}

export async function logSet(
  sessionId: string,
  exerciseIndex: number,
  setData: {
    weight?: number;
    reps?: number;
    durationSeconds?: number;
    distance?: number;
    rpe?: number;
  },
): Promise<LogSetResult> {
  const { data } = await client.post(`/api/sessions/${sessionId}/sets`, {
    exerciseIndex,
    ...setData,
  });
  return data.data as LogSetResult;
}

export async function addExerciseToSession(
  sessionId: string,
  payload: { exercise: string; order?: number; notes?: string; restSeconds?: number },
): Promise<ActiveSession> {
  const { data } = await client.post(`/api/sessions/${sessionId}/exercises`, payload);
  return data.data as ActiveSession;
}

export async function removeExerciseFromSession(
  sessionId: string,
  exerciseIndex: number,
): Promise<ActiveSession> {
  const { data } = await client.delete(
    `/api/sessions/${sessionId}/exercises/${exerciseIndex}`,
  );
  return data.data as ActiveSession;
}

export async function pauseSession(sessionId: string): Promise<ActiveSession> {
  const { data } = await client.post(`/api/sessions/${sessionId}/pause`);
  return data.data as ActiveSession;
}

export async function resumeSession(sessionId: string): Promise<ActiveSession> {
  const { data } = await client.post(`/api/sessions/${sessionId}/resume`);
  return data.data as ActiveSession;
}

export async function discardSession(sessionId: string): Promise<void> {
  await client.post(`/api/sessions/${sessionId}/discard`);
}

export async function finishSession(sessionId: string): Promise<FinishSessionResult> {
  const { data } = await client.post(`/api/sessions/${sessionId}/finish`);
  return data.data as FinishSessionResult;
}

export async function getCalendar(params?: { startDate?: string; endDate?: string }) {
  const { data } = await client.get('/api/sessions/calendar', { params });
  return data.data;
}

export async function getSessionHistory(params?: { page?: number; limit?: number }) {
  const { data } = await client.get('/api/sessions', { params });
  return data as { success: boolean; data: import('../types/api').SessionHistoryItem[]; pagination: import('../types/api').Pagination };
}

export async function getSessionById(id: string) {
  const { data } = await client.get(`/api/sessions/${id}`);
  return data.data as import('../types/api').SessionDetail;
}
