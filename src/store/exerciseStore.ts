import { create } from 'zustand';
import * as exercisesApi from '../api/exercises';
import type { Exercise, MuscleGroup } from '../types/api';

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface ExerciseState {
  exercises: Exercise[];
  pagination: Pagination | null;
  suggestedExercises: Exercise[];
  selectedExercise: Exercise | null;
  searchQuery: string;
  muscleGroupFilter: MuscleGroup | null;
  isLoading: boolean;
  isSuggestedLoading: boolean;
  error: string | null;
}

interface ExerciseActions {
  fetchExercises: (page?: number, reset?: boolean) => Promise<void>;
  fetchSuggested: (muscleGroup?: string, limit?: number) => Promise<void>;
  fetchExerciseById: (id: string) => Promise<Exercise | null>;
  setSearchQuery: (query: string) => void;
  setMuscleGroupFilter: (group: MuscleGroup | null) => Promise<void>;
  setSelectedExercise: (exercise: Exercise | null) => void;
  resetExercises: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useExerciseStore = create<ExerciseState & ExerciseActions>((set, get) => ({
  exercises: [],
  pagination: null,
  suggestedExercises: [],
  selectedExercise: null,
  searchQuery: '',
  muscleGroupFilter: null,
  isLoading: false,
  isSuggestedLoading: false,
  error: null,

  fetchExercises: async (page = 1, reset = false) => {
    const { searchQuery, muscleGroupFilter } = get();
    set({ isLoading: true, error: null });
    try {
      const result = await exercisesApi.getExercises({
        page,
        search: searchQuery || undefined,
        muscleGroup: muscleGroupFilter ?? undefined,
        limit: 20,
      });
      set(state => ({
        exercises: reset ? result.data : [...state.exercises, ...result.data],
        pagination: result.pagination,
        isLoading: false,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch exercises';
      set({ isLoading: false, error: msg });
    }
  },

  fetchSuggested: async (muscleGroup, limit) => {
    set({ isSuggestedLoading: true });
    try {
      const exercises = await exercisesApi.getSuggestedExercises({ muscleGroup, limit });
      set({ suggestedExercises: exercises, isSuggestedLoading: false });
    } catch {
      set({ isSuggestedLoading: false });
    }
  },

  fetchExerciseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const exercise = await exercisesApi.getExerciseById(id);
      set({ selectedExercise: exercise, isLoading: false });
      return exercise;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch exercise';
      set({ isLoading: false, error: msg });
      return null;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setMuscleGroupFilter: async (group) => {
    set({ muscleGroupFilter: group, exercises: [], pagination: null });
    await get().fetchExercises(1, true);
  },

  setSelectedExercise: (exercise) => set({ selectedExercise: exercise }),

  resetExercises: () => set({ exercises: [], pagination: null, searchQuery: '', muscleGroupFilter: null }),

  clearError: () => set({ error: null }),
  reset: () => set({ exercises: [], pagination: null, suggestedExercises: [], selectedExercise: null, searchQuery: '', muscleGroupFilter: null, isLoading: false, isSuggestedLoading: false, error: null }),
}));
