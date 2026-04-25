// ─── Shared API types ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
}

// ─── Exercise ────────────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'glutes'
  | 'calves'
  | 'cardio';

export interface Exercise {
  _id: string;
  name: string;
  slug: string;
  muscleGroup: MuscleGroup;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  type: 'compound' | 'isolation';
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  defaultRepRange: { min: number; max: number };
  exerciseType: 'strength' | 'cardio';
  trackingType: 'reps' | 'time' | 'distance';
  description?: string;
  imageUrl?: string;
  isSystem: boolean;
  progressionStep: number;
}

export interface ExerciseLastPerformance {
  lastWeight: number;
  lastReps: number;
  bestWeight: number;
  bestReps: number;
  estimated1RM: number;
}

export interface ProgressionData {
  nextWeight: number;
  action: 'increase' | 'hold';
  repRange: string;
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface TemplateExercise {
  exercise: string;
  order: number;
  sets: number;
  repRange?: { min: number; max: number };
  restSeconds: number;
  supersetGroup?: number;
  notes?: string;
}

// Populated variant returned by GET /api/templates/:id
export interface PopulatedTemplateExercise extends Omit<TemplateExercise, 'exercise'> {
  exercise: Exercise;
}

export interface WorkoutTemplate {
  _id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isGenerated: boolean;
  isPlanTemplate: boolean;
  exercises: TemplateExercise[];
  createdAt: string;
}

export interface PopulatedWorkoutTemplate extends Omit<WorkoutTemplate, 'exercises'> {
  exercises: PopulatedTemplateExercise[];
}

export interface TemplatePayload {
  name: string;
  description?: string;
  exercises: Array<{
    exercise: string;
    order: number;
    sets: number;
    repRange?: { min: number; max: number };
    restSeconds?: number;
    supersetGroup?: number;
    notes?: string;
  }>;
}

// ─── Workout Plan ─────────────────────────────────────────────────────────────

export interface TodayPlan {
  planId: string;
  planName: string;
  currentIndex: number;
  totalDays: number;
  today: {
    type: 'workout' | 'rest';
    label: string | null;
    template: WorkoutTemplate | null;
  };
  skippedDays: number;
}

// ─── Workout Session ─────────────────────────────────────────────────────────

export interface SessionSet {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  durationSeconds?: number | null;
  distance?: number | null;
  rpe?: number | null;
  completed: boolean;
  isPR: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  exerciseType: 'strength' | 'cardio';
  trackingType: 'reps' | 'time' | 'distance';
  order: number;
  lastPerformance: { weight: number; reps: number } | null;
  bestPerformance: { weight: number; reps: number } | null;
  suggestion: {
    weight: number;
    reps: number | null;
    action: 'increase' | 'hold' | 'decrease';
  } | null;
  restSeconds: number;
  sets: SessionSet[];
}

export interface ActiveSession {
  id: string;
  name: string;
  status: 'active' | 'paused';
  startedAt: string;
  durationSeconds: number;
  exercises: SessionExercise[];
}

export interface LogSetResult {
  exerciseIndex: number;
  newSet: SessionSet;
  summary: {
    bestWeight: number;
    bestReps: number;
    volume: number;
    setCount: number;
  };
}

export interface FinishSessionResult {
  summary: {
    totalVolume: number;
    totalSets: number;
    totalExercises: number;
    duration: number;
  };
  xp: {
    earned: number;
    total: number;
  };
  streak: {
    current: number;
    continued: boolean;
  };
  personalRecords: Array<{
    exercise: string;
    type: 'weight' | '1rm' | 'volume' | 'distance' | 'time';
    value: number;
  }>;
  message: string;
}

// ─── Workout Plan ─────────────────────────────────────────────────────────────

export interface PlanDay {
  _id: string;
  order: number;
  type: 'workout' | 'rest';
  template?: WorkoutTemplate;
  label?: string;
}

export interface WorkoutPlan {
  _id: string;
  name: string;
  days: PlanDay[];
  currentDayIndex: number;
  lastCompletedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanExercise {
  exercise: string;
  order: number;
  sets: number;
  repRange?: { min: number; max: number };
  restSeconds?: number;
  notes?: string;
}

export type CreatePlanDay =
  | { type: 'workout'; label?: string; name?: string; exercises: CreatePlanExercise[] }
  | { type: 'rest'; label?: string };

export interface CreatePlanPayload {
  name: string;
  days: CreatePlanDay[];
}

// ─── Progress / Calendar ─────────────────────────────────────────────────────

export interface CalendarDayData {
  workouts: Array<{ name: string; duration: number }>;
  totalVolume: number;
  totalDuration: number;
  hasPR: boolean;
}

export interface SessionHistoryItem {
  _id: string;
  name: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface SessionDetailSet {
  setNumber?: number;
  weight?: number;
  reps?: number;
  durationSeconds?: number;
  distance?: number;
  rpe?: number;
  isWarmup: boolean;
  completed: boolean;
  isPR: boolean;
}

export interface SessionDetailExercise {
  exercise: Exercise;
  order?: number;
  notes?: string;
  sets: SessionDetailSet[];
  completed: boolean;
  summary: { bestWeight: number; bestReps: number; volume: number; setCount: number };
  restSeconds: number;
  exerciseType: 'strength' | 'cardio';
  trackingType: 'reps' | 'time' | 'distance';
}

export interface SessionDetail {
  _id: string;
  name: string;
  exercises: SessionDetailExercise[];
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  completed: boolean;
  status: string;
  sessionSummary: {
    totalVolume: number;
    totalSets: number;
    totalExercises: number;
    personalRecords: Array<{ exercise: string; type: string; value: number }>;
  };
}

export interface ExerciseTimePoint {
  date: string;
  weight: number;
  reps: number;
  volume: number;
  estimated1RM: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardData {
  streak: { current: number; longest: number };
  xp: { total: number; level: number };
  lastWorkout: {
    name: string;
    date: string;
    duration: number;
    volume: number;
  } | null;
  weeklyVolume: number;
  volumeByDay: Record<string, number>;
  topExercises: Array<{ exerciseId: string; name: string; volume: number }>;
  todayPlan: TodayPlan | null;
  isFirstTimeUser: boolean;
}
