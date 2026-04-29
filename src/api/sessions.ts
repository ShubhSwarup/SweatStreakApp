import client from './client';
import type { ActiveSession, FinishSessionResult, LogSetResult } from '../types/api';

// MongoDB returns _id; normalize to id so every caller can use session.id safely.
function normalizeSession(raw: any): ActiveSession {
  if (!raw) return raw;
  const session = { ...raw };
  if (!session.id && session._id) session.id = String(session._id);
  if (Array.isArray(session.exercises)) {
    session.exercises = session.exercises.map((ex: any) => ({
      ...ex,
      exerciseId: ex.exerciseId ?? ex.exercise ?? ex._id ?? '',
      name: ex.name ?? ex.exerciseName ?? '',
      sets: Array.isArray(ex.sets) ? ex.sets : [],
    }));
  }
  return session as ActiveSession;
}

// Remove undefined, null, and NaN values so we never send garbage to the backend.
function cleanPayload<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && !(typeof v === 'number' && isNaN(v))) {
      out[k] = v;
    }
  }
  return out as Partial<T>;
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  const { data } = await client.get('/api/sessions/active');
  const raw = data.data;
  if (!raw) return null;
  return normalizeSession(raw);
}

export async function startSession(payload: {
  name?: string;
  template?: string;
}): Promise<{ session: ActiveSession; isExisting: boolean }> {
  const { data } = await client.post('/api/sessions/start', cleanPayload(payload));
  const result = data.data ?? data;
  return {
    session: normalizeSession(result.session ?? result),
    isExisting: result.isExisting ?? false,
  };
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
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('logSet called with invalid sessionId');
  }
  const payload = cleanPayload({ exerciseIndex, ...setData });
  const { data } = await client.post(`/api/sessions/${sessionId}/sets`, payload);
  return data.data as LogSetResult;
}

export async function addExerciseToSession(
  sessionId: string,
  payload: { exercise: string; order?: number; notes?: string; restSeconds?: number },
): Promise<ActiveSession> {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('addExercise called with invalid sessionId');
  }
  const { data } = await client.post(
    `/api/sessions/${sessionId}/exercises`,
    cleanPayload(payload),
  );
  return normalizeSession(data.data);
}

export async function removeExerciseFromSession(
  sessionId: string,
  exerciseIndex: number,
): Promise<ActiveSession> {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('removeExercise called with invalid sessionId');
  }
  const { data } = await client.delete(
    `/api/sessions/${sessionId}/exercises/${exerciseIndex}`,
  );
  return normalizeSession(data.data);
}

export async function removeSet(
  sessionId: string,
  exerciseIndex: number,
  setNumber: number,
): Promise<ActiveSession> {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('removeSet called with invalid sessionId');
  }
  const { data } = await client.delete(
    `/api/sessions/${sessionId}/exercises/${exerciseIndex}/sets/${setNumber}`,
  );
  return normalizeSession(data.data);
}

export async function unlogSet(
  sessionId: string,
  exerciseIndex: number,
  setNumber: number,
): Promise<ActiveSession> {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('unlogSet called with invalid sessionId');
  }
  const { data } = await client.patch(
    `/api/sessions/${sessionId}/exercises/${exerciseIndex}/sets/${setNumber}/unlog`,
  );
  return normalizeSession(data.data);
}

export async function pauseSession(sessionId: string): Promise<ActiveSession> {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('pauseSession called with invalid sessionId');
  }
  const { data } = await client.post(`/api/sessions/${sessionId}/pause`);
  return normalizeSession(data.data);
}

export async function resumeSession(sessionId: string): Promise<ActiveSession> {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('resumeSession called with invalid sessionId');
  }
  const { data } = await client.post(`/api/sessions/${sessionId}/resume`);
  return normalizeSession(data.data);
}

export async function discardSession(sessionId: string): Promise<void> {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('discardSession called with invalid sessionId');
  }
  await client.post(`/api/sessions/${sessionId}/discard`);
}

export async function finishSession(sessionId: string): Promise<FinishSessionResult> {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error('finishSession called with invalid sessionId');
  }
  const { data } = await client.post(`/api/sessions/${sessionId}/finish`);
  return data.data as FinishSessionResult;
}

export async function getCalendar(params?: { startDate?: string; endDate?: string }) {
  const { data } = await client.get('/api/sessions/calendar', { params });
  return data.data;
}

export async function getSessionHistory(params?: { page?: number; limit?: number }) {
  const { data } = await client.get('/api/sessions', { params });
  return data as {
    success: boolean;
    data: import('../types/api').SessionHistoryItem[];
    pagination: import('../types/api').Pagination;
  };
}

export async function getSessionById(id: string) {
  const { data } = await client.get(`/api/sessions/${id}`);
  return data.data as import('../types/api').SessionDetail;
}
