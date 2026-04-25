import { create } from 'zustand';
import * as sessionsApi from '../api/sessions';
import * as analyticsApi from '../api/analytics';
import { getExerciseLastPerformance, getProgression } from '../api/progression';
import type {
  CalendarDayData,
  SessionHistoryItem,
  SessionDetail,
  Pagination,
  ExerciseLastPerformance,
  ProgressionData,
  ExerciseTimePoint,
} from '../types/api';

interface ProgressState {
  calendarData: Record<string, CalendarDayData> | null;
  sessionHistory: SessionHistoryItem[];
  sessionHistoryPagination: Pagination | null;
  sessionsByDate: Record<string, SessionHistoryItem[]>;
  currentSession: SessionDetail | null;
  weeklyAnalytics: Record<string, { volume: number; workouts: number }> | null;
  exerciseStats: ExerciseLastPerformance | null;
  exerciseProgression: ProgressionData | null;
  exerciseTimeSeries: ExerciseTimePoint[];
  isCalendarLoading: boolean;
  isHistoryLoading: boolean;
  isSessionLoading: boolean;
  isExerciseProgressLoading: boolean;
  error: string | null;
}

interface ProgressActions {
  fetchCalendar: (startDate?: string, endDate?: string) => Promise<void>;
  fetchSessionHistory: (page?: number, reset?: boolean) => Promise<void>;
  fetchSessionById: (id: string) => Promise<void>;
  fetchWeeklyAnalytics: () => Promise<void>;
  fetchExerciseProgress: (exerciseId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

function buildSessionsByDate(sessions: SessionHistoryItem[]): Record<string, SessionHistoryItem[]> {
  const map: Record<string, SessionHistoryItem[]> = {};
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!map[key]) map[key] = [];
    map[key].push(s);
  }
  return map;
}

export const useProgressStore = create<ProgressState & ProgressActions>((set, get) => ({
  calendarData: null,
  sessionHistory: [],
  sessionHistoryPagination: null,
  sessionsByDate: {},
  currentSession: null,
  weeklyAnalytics: null,
  exerciseStats: null,
  exerciseProgression: null,
  exerciseTimeSeries: [],
  isCalendarLoading: false,
  isHistoryLoading: false,
  isSessionLoading: false,
  isExerciseProgressLoading: false,
  error: null,

  fetchCalendar: async (startDate, endDate) => {
    set({ isCalendarLoading: true, error: null });
    try {
      const data = await sessionsApi.getCalendar({ startDate, endDate });
      set({ calendarData: data, isCalendarLoading: false });
    } catch (err: any) {
      set({ isCalendarLoading: false, error: err?.message ?? 'Failed to load calendar' });
    }
  },

  fetchSessionHistory: async (page = 1, reset = false) => {
    set({ isHistoryLoading: true, error: null });
    try {
      const result = await sessionsApi.getSessionHistory({ page, limit: 20 });
      const incoming = result.data ?? [];
      const merged = reset ? incoming : [...get().sessionHistory, ...incoming];
      set({
        sessionHistory: merged,
        sessionHistoryPagination: result.pagination,
        sessionsByDate: buildSessionsByDate(merged),
        isHistoryLoading: false,
      });
    } catch (err: any) {
      set({ isHistoryLoading: false, error: err?.message ?? 'Failed to load history' });
    }
  },

  fetchSessionById: async (id) => {
    set({ isSessionLoading: true, error: null });
    try {
      const session = await sessionsApi.getSessionById(id);
      set({ currentSession: session, isSessionLoading: false });
    } catch (err: any) {
      set({ isSessionLoading: false, error: err?.message ?? 'Failed to load session' });
    }
  },

  fetchWeeklyAnalytics: async () => {
    try {
      const data = await analyticsApi.getWeeklyAnalytics();
      set({ weeklyAnalytics: data });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load analytics' });
    }
  },

  fetchExerciseProgress: async (exerciseId) => {
    set({ isExerciseProgressLoading: true, exerciseTimeSeries: [], exerciseStats: null, exerciseProgression: null });
    try {
      const [statsRes, progRes] = await Promise.all([
        getExerciseLastPerformance(exerciseId),
        getProgression(exerciseId),
      ]);

      const historyRes = await sessionsApi.getSessionHistory({ page: 1, limit: 15 });
      const sessions = historyRes.data ?? [];

      const detailResults = await Promise.allSettled(
        sessions.slice(0, 10).map(s => sessionsApi.getSessionById(s._id)),
      );

      const timeSeries: ExerciseTimePoint[] = [];

      for (const result of detailResults) {
        if (result.status !== 'fulfilled') continue;
        const detail = result.value;
        if (!detail?.exercises) continue;

        const ex = detail.exercises.find(e => {
          const exObj = e.exercise as any;
          return (typeof exObj === 'object' ? exObj._id : exObj) === exerciseId;
        });

        if (!ex?.sets?.length) continue;

        const completedSets = ex.sets.filter(s => s.completed && s.weight != null && s.reps != null);
        if (!completedSets.length) continue;

        const bestSet = completedSets.reduce((best, s) =>
          (s.weight ?? 0) > (best.weight ?? 0) ? s : best,
        );

        timeSeries.push({
          date: detail.startedAt,
          weight: bestSet.weight!,
          reps: bestSet.reps!,
          volume: ex.summary.volume,
          estimated1RM: bestSet.weight! * (1 + bestSet.reps! / 30),
        });
      }

      timeSeries.reverse();

      set({
        exerciseStats: statsRes.data,
        exerciseProgression: progRes.data,
        exerciseTimeSeries: timeSeries,
        isExerciseProgressLoading: false,
      });
    } catch (err: any) {
      set({ isExerciseProgressLoading: false, error: err?.message ?? 'Failed to load exercise data' });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ calendarData: null, sessionHistory: [], sessionHistoryPagination: null, sessionsByDate: {}, currentSession: null, weeklyAnalytics: null, exerciseStats: null, exerciseProgression: null, exerciseTimeSeries: [], isCalendarLoading: false, isHistoryLoading: false, isSessionLoading: false, isExerciseProgressLoading: false, error: null }),
}));
