import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// ─── Tab Stacks ───────────────────────────────────────────────────────────────

export type DashboardStackParamList = {
  Dashboard: undefined;
};

export type WorkoutsStackParamList = {
  WorkoutHub: { mode?: 'default' | 'quickStart' | 'plan' | 'swap' | 'resume'; currentWorkoutName?: string } | undefined;
  TemplateDetail: { templateId: string };
  ActiveSession: undefined;
  TemplateCreator: { templateId?: string } | undefined;
  PlanCreator: { planId?: string } | undefined;
};

export type ProgressStackParamList = {
  ProgressHub: undefined;
  PastSessionDetail: { sessionId: string };
  ExerciseProgressDetail: { exerciseId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  PlanList: undefined;
  PlanDetail: { planId: string };
  PlanCreator: { planId?: string } | undefined;
  AISuggestions: undefined;
  Settings: undefined;
  Friends: undefined;
};

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  WorkoutsTab: NavigatorScreenParams<WorkoutsStackParamList>;
  ProgressTab: NavigatorScreenParams<ProgressStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// ─── Root Navigator ───────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// ─── Screen prop helpers ──────────────────────────────────────────────────────

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type DashboardScreenProps<T extends keyof DashboardStackParamList> = CompositeScreenProps<NativeStackScreenProps<DashboardStackParamList, T>, BottomTabScreenProps<MainTabParamList>>;
export type WorkoutsScreenProps<T extends keyof WorkoutsStackParamList> = CompositeScreenProps<NativeStackScreenProps<WorkoutsStackParamList, T>, BottomTabScreenProps<MainTabParamList>>;
export type ProgressScreenProps<T extends keyof ProgressStackParamList> = CompositeScreenProps<NativeStackScreenProps<ProgressStackParamList, T>, BottomTabScreenProps<MainTabParamList>>;
export type ProfileScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<NativeStackScreenProps<ProfileStackParamList, T>, BottomTabScreenProps<MainTabParamList>>;
