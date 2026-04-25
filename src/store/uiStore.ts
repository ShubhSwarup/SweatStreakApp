import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinishSessionResult } from '../types/api';

type OverlayName =
  | 'exercisePicker'
  | 'exerciseDetail'
  | 'restTimer'
  | 'plateCalculator'
  | 'sessionAction'
  | 'createWorkoutChooser'
  | 'prCelebration'
  | 'xpLevelUp'
  | 'sessionSummary'
  | null;

export type PostSessionItem = 'prCelebration' | 'xpLevelUp' | 'sessionSummary';

export interface PostSessionData {
  finishResult: FinishSessionResult;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  exerciseNames: Record<string, string>;
  sessionId: string;
}

export type WeightUnit = 'kg' | 'lbs';

interface UIState {
  activeOverlay: OverlayName;
  overlayData: Record<string, unknown>;
  postSessionQueue: PostSessionItem[];
  postSessionData: PostSessionData | null;
  // User preferences (persisted to AsyncStorage)
  weightUnit: WeightUnit;
  restTimerDefault: number; // seconds
  notificationsEnabled: boolean;
}

interface UIActions {
  openOverlay: (name: NonNullable<OverlayName>, data?: Record<string, unknown>) => void;
  closeOverlay: () => void;
  setPostSessionQueue: (items: PostSessionItem[]) => void;
  advancePostSessionQueue: () => void;
  setPostSessionData: (data: PostSessionData) => void;
  clearPostSessionData: () => void;
  setWeightUnit: (unit: WeightUnit) => Promise<void>;
  setRestTimerDefault: (seconds: number) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  loadPreferences: () => Promise<void>;
  reset: () => void;
}

const PREFS_KEY = 'ui_preferences';

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  activeOverlay: null,
  overlayData: {},
  postSessionQueue: [],
  postSessionData: null,
  weightUnit: 'kg',
  restTimerDefault: 90,
  notificationsEnabled: true,

  openOverlay: (name, data = {}) => set({ activeOverlay: name, overlayData: data }),

  closeOverlay: () => set({ activeOverlay: null, overlayData: {} }),

  setPostSessionQueue: (items) => set({ postSessionQueue: items }),

  advancePostSessionQueue: () => {
    const { postSessionQueue } = get();
    const [next, ...remaining] = postSessionQueue;
    if (next) {
      set({ postSessionQueue: remaining, activeOverlay: next });
    } else {
      set({ postSessionQueue: [], activeOverlay: null });
    }
  },

  setPostSessionData: (data) => set({ postSessionData: data }),
  clearPostSessionData: () => set({ postSessionData: null }),

  setWeightUnit: async (unit) => {
    set({ weightUnit: unit });
    const { restTimerDefault, notificationsEnabled } = get();
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ weightUnit: unit, restTimerDefault, notificationsEnabled }));
  },

  setRestTimerDefault: async (seconds) => {
    set({ restTimerDefault: seconds });
    const { weightUnit, notificationsEnabled } = get();
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ weightUnit, restTimerDefault: seconds, notificationsEnabled }));
  },

  setNotificationsEnabled: async (enabled) => {
    set({ notificationsEnabled: enabled });
    const { weightUnit, restTimerDefault } = get();
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ weightUnit, restTimerDefault, notificationsEnabled: enabled }));
  },

  loadPreferences: async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        set({
          weightUnit: prefs.weightUnit ?? 'kg',
          restTimerDefault: prefs.restTimerDefault ?? 90,
          notificationsEnabled: prefs.notificationsEnabled ?? true,
        });
      }
    } catch {
      // use defaults
    }
  },

  reset: () => set({
    activeOverlay: null,
    overlayData: {},
    postSessionQueue: [],
    postSessionData: null,
  }),
}));
