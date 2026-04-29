import type { PRCardProps } from './PRCard';

export type ShareTemplate = 'pr' | 'session' | 'overlay';

export type CaptionMode = 'minimal' | 'motivational' | 'aggressive' | 'funny';

export interface ShareData {
  volume: number;
  sets: number;
  duration: number;
  streak: number;
  intensity: boolean;
  date: string;
  level: string;
  prExercise: string;
  prType: PRCardProps['prType'];
  prNewValue: number;
  prNewReps?: number;
  prOldValue?: number;
  workoutName: string;
  muscleGroup: string;
  percentile?: number;
}
