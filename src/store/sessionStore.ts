import { create } from 'zustand';
import * as sessionsApi from '../api/sessions';
import { log } from '../utils/logger';
import type {
  ActiveSession,
  FinishSessionResult,
  SessionExercise,
  SessionSet,
} from '../types/api';

interface SessionState {
  activeSession: ActiveSession | null;
  finishResult: FinishSessionResult | null;
  isLoading: boolean;
  isStarting: boolean;
  isFinishing: boolean;
  error: string | null;
}

interface SessionActions {
  fetchActiveSession: () => Promise<void>;
  startSession: (name?: string, templateId?: string) => Promise<void>;
  logSet: (
    exerciseIndex: number,
    setData: {
      weight?: number;
      reps?: number;
      durationSeconds?: number;
      distance?: number;
      rpe?: number;
    },
  ) => Promise<void>;
  addExercise: (
    exerciseId: string,
    order?: number,
    notes?: string,
    restSeconds?: number,
  ) => Promise<void>;
  removeExercise: (exerciseIndex: number) => Promise<void>;
  removePendingSet: (exerciseIndex: number, setNumber: number) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  discardSession: () => Promise<void>;
  finishSession: () => Promise<FinishSessionResult | null>;
  clearFinishResult: () => void;
  clearError: () => void;
  reset: () => void;
}

function sessionId(state: { activeSession: ActiveSession | null }): string | null {
  const id = state.activeSession?.id;
  if (!id || id === 'undefined') {
    log.error('SessionStore', 'activeSession.id is missing:', state.activeSession);
    return null;
  }
  return id;
}

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  activeSession: null,
  finishResult: null,
  isLoading: false,
  isStarting: false,
  isFinishing: false,
  error: null,

  fetchActiveSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await sessionsApi.getActiveSession();
      set({ activeSession: session, isLoading: false });
    } catch (err: any) {
      log.error('SessionStore', 'fetchActiveSession failed:', err);
      set({ isLoading: false, error: err?.message ?? 'Failed to fetch session' });
    }
  },

  startSession: async (name, templateId) => {
    set({ isStarting: true, error: null });
    try {
      const result = await sessionsApi.startSession({ name, template: templateId });
      if (!result.session?.id) {
        log.error('SessionStore', 'startSession: response missing session.id', result);
      }
      set({ activeSession: result.session, isStarting: false });
    } catch (err: any) {
      log.error('SessionStore', 'startSession failed:', err);
      set({ isStarting: false, error: err?.message ?? 'Failed to start session' });
      throw err;
    }
  },

  logSet: async (exerciseIndex, setData) => {
    const id = sessionId(get());
    if (!id) {
      set({ error: 'No active session' });
      return;
    }
    const { activeSession } = get();
    if (!activeSession) return;
    try {
      const result = await sessionsApi.logSet(id, exerciseIndex, setData);
      const { newSet } = result;
      const updatedExercises = activeSession.exercises.map(
        (ex: SessionExercise, i: number) => {
          if (i !== exerciseIndex) return ex;
          const incompleteIdx = ex.sets.findIndex(
            (s: SessionSet) => s.setNumber === newSet.setNumber && !s.completed,
          );
          const newSets =
            incompleteIdx >= 0
              ? ex.sets.map((s: SessionSet, si: number) =>
                  si === incompleteIdx ? { ...s, ...newSet } : s,
                )
              : [...ex.sets, newSet];
          return { ...ex, sets: newSets };
        },
      );
      set({ activeSession: { ...activeSession, exercises: updatedExercises } });
    } catch (err: any) {
      log.error('SessionStore', 'logSet failed (exerciseIndex=%d):', exerciseIndex, err);
      set({ error: err?.message ?? 'Failed to log set' });
      throw err;
    }
  },

  addExercise: async (exerciseId, order, notes, restSeconds) => {
    const id = sessionId(get());
    if (!id) {
      set({ error: 'No active session' });
      return;
    }
    try {
      const updated = await sessionsApi.addExerciseToSession(id, {
        exercise: exerciseId,
        order,
        notes,
        restSeconds,
      });
      set({ activeSession: updated });
    } catch (err: any) {
      log.error('SessionStore', 'addExercise failed:', err);
      set({ error: err?.message ?? 'Failed to add exercise' });
    }
  },

  removeExercise: async (exerciseIndex) => {
    const id = sessionId(get());
    if (!id) {
      set({ error: 'No active session' });
      return;
    }
    try {
      const updated = await sessionsApi.removeExerciseFromSession(id, exerciseIndex);
      set({ activeSession: updated });
    } catch (err: any) {
      log.error('SessionStore', 'removeExercise failed (index=%d):', exerciseIndex, err);
      set({ error: err?.message ?? 'Failed to remove exercise' });
      throw err;
    }
  },

  removePendingSet: async (exerciseIndex, setNumber) => {
    const id = sessionId(get());
    if (!id) {
      set({ error: 'No active session' });
      return;
    }
    try {
      const updated = await sessionsApi.removeSet(id, exerciseIndex, setNumber);
      set({ activeSession: updated });
    } catch (err: any) {
      log.error('SessionStore', `removePendingSet failed (exercise=${exerciseIndex}, set=${setNumber}):`, err);
      set({ error: err?.message ?? 'Failed to remove set' });
      throw err;
    }
  },

  pauseSession: async () => {
    const id = sessionId(get());
    if (!id) {
      set({ error: 'No active session' });
      return;
    }
    try {
      const updated = await sessionsApi.pauseSession(id);
      set({ activeSession: updated });
    } catch (err: any) {
      log.error('SessionStore', 'pauseSession failed:', err);
      set({ error: err?.message ?? 'Failed to pause session' });
      throw err;
    }
  },

  resumeSession: async () => {
    const id = sessionId(get());
    if (!id) {
      set({ error: 'No active session' });
      return;
    }
    try {
      const updated = await sessionsApi.resumeSession(id);
      set({ activeSession: updated });
    } catch (err: any) {
      log.error('SessionStore', 'resumeSession failed:', err);
      set({ error: err?.message ?? 'Failed to resume session' });
      throw err;
    }
  },

  discardSession: async () => {
    const id = sessionId(get());
    if (!id) {
      // Nothing to discard — clear local state and let caller navigate
      set({ activeSession: null });
      return;
    }
    try {
      await sessionsApi.discardSession(id);
      set({ activeSession: null });
    } catch (err: any) {
      log.error('SessionStore', 'discardSession failed:', err);
      // Still clear local state so UI can proceed
      set({ activeSession: null, error: err?.message ?? 'Failed to discard session' });
      throw err;
    }
  },

  finishSession: async () => {
    const id = sessionId(get());
    if (!id) {
      set({ error: 'No active session to finish' });
      return null;
    }
    set({ isFinishing: true, error: null });
    try {
      const result = await sessionsApi.finishSession(id);
      set({ activeSession: null, finishResult: result, isFinishing: false });
      return result;
    } catch (err: any) {
      log.error('SessionStore', 'finishSession failed (id=%s):', id, err);
      set({ isFinishing: false, error: err?.message ?? 'Failed to finish session' });
      throw err;
    }
  },

  clearFinishResult: () => set({ finishResult: null }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      activeSession: null,
      finishResult: null,
      isLoading: false,
      isStarting: false,
      isFinishing: false,
      error: null,
    }),
}));
