import { create } from 'zustand';
import * as sessionsApi from '../api/sessions';
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
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  discardSession: () => Promise<void>;
  finishSession: () => Promise<FinishSessionResult | null>;
  clearFinishResult: () => void;
  clearError: () => void;
  reset: () => void;
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
      set({ isLoading: false, error: err?.message ?? 'Failed to fetch session' });
    }
  },

  startSession: async (name, templateId) => {
    set({ isStarting: true, error: null });
    try {
      const result = await sessionsApi.startSession({ name, template: templateId });
      set({ activeSession: result.session, isStarting: false });
    } catch (err: any) {
      set({ isStarting: false, error: err?.message ?? 'Failed to start session' });
      throw err;
    }
  },

  logSet: async (exerciseIndex, setData) => {
    const { activeSession } = get();
    if (!activeSession) return;
    try {
      const result = await sessionsApi.logSet(activeSession.id, exerciseIndex, setData);
      const { newSet } = result;
      const updatedExercises = activeSession.exercises.map(
        (ex: SessionExercise, i: number) => {
          if (i !== exerciseIndex) return ex;
          // Replace first matching incomplete set or append
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
      set({ error: err?.message ?? 'Failed to log set' });
      throw err;
    }
  },

  addExercise: async (exerciseId, order, notes, restSeconds) => {
    const { activeSession } = get();
    if (!activeSession) return;
    try {
      const updated = await sessionsApi.addExerciseToSession(activeSession.id, {
        exercise: exerciseId,
        order,
        notes,
        restSeconds,
      });
      set({ activeSession: updated });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to add exercise' });
    }
  },

  removeExercise: async (exerciseIndex) => {
    const { activeSession } = get();
    if (!activeSession) return;
    try {
      const updated = await sessionsApi.removeExerciseFromSession(
        activeSession.id,
        exerciseIndex,
      );
      set({ activeSession: updated });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to remove exercise' });
    }
  },

  pauseSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;
    try {
      const updated = await sessionsApi.pauseSession(activeSession.id);
      set({ activeSession: updated });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to pause session' });
      throw err;
    }
  },

  resumeSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;
    try {
      const updated = await sessionsApi.resumeSession(activeSession.id);
      set({ activeSession: updated });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to resume session' });
      throw err;
    }
  },

  discardSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;
    try {
      await sessionsApi.discardSession(activeSession.id);
      set({ activeSession: null });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to discard session' });
      throw err;
    }
  },

  finishSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return null;
    set({ isFinishing: true, error: null });
    try {
      const result = await sessionsApi.finishSession(activeSession.id);
      set({ activeSession: null, finishResult: result, isFinishing: false });
      return result;
    } catch (err: any) {
      set({ isFinishing: false, error: err?.message ?? 'Failed to finish session' });
      throw err;
    }
  },

  clearFinishResult: () => set({ finishResult: null }),
  clearError: () => set({ error: null }),
  reset: () => set({ activeSession: null, finishResult: null, isLoading: false, isStarting: false, isFinishing: false, error: null }),
}));
