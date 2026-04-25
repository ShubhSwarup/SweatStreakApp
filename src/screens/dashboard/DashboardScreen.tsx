import React, { useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';
import { useTemplateStore } from '../../store/templateStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import StreakBadge from '../../components/dashboard/StreakBadge';
import XPLevelCard from '../../components/dashboard/XPLevelCard';
import WeeklyVolumeChart from '../../components/dashboard/WeeklyVolumeChart';
import TodayPlanCard from '../../components/dashboard/TodayPlanCard';
import PreviousSessionCard from '../../components/dashboard/PreviousSessionCard';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore } from '../../store/sessionStore';
import { getSessionHistory } from '../../api/sessions';
import type { WorkoutTemplate } from '../../types/api';
import type { DashboardScreenProps } from '../../navigation/types';

type DashboardState = 'ftu' | 'workoutDay' | 'restDay' | 'flexible';

function resolveDashboardState(
  isFirstTimeUser: boolean,
  todayPlanType?: 'workout' | 'rest',
): DashboardState {
  if (isFirstTimeUser) return 'ftu';
  if (todayPlanType === 'workout') return 'workoutDay';
  if (todayPlanType === 'rest') return 'restDay';
  return 'flexible';
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'MORNING';
  if (h < 17) return 'AFTERNOON';
  return 'EVENING';
}

interface HeaderProps {
  firstName: string;
  onPress: () => void;
}

function DashboardHeader({ firstName, onPress }: HeaderProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.header}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.greeting}>
        <Text style={styles.greetingTime}>GOOD {timeGreeting()}</Text>
        <Text style={styles.greetingName}>{firstName}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }: DashboardScreenProps<'Dashboard'>) {
  const { data, isLoading, error, fetchDashboard } = useDashboardStore();
  const user = useAuthStore(state => state.user);
  const { userTemplates, fetchUserTemplates } = useTemplateStore();
  const openOverlay = useUIStore(state => state.openOverlay);
  const { startSession, isStarting } = useSessionStore();

  const firstName = user?.name?.split(' ')[0] ?? 'Athlete';

  const dashboardState: DashboardState | null = data
    ? resolveDashboardState(data.isFirstTimeUser, data.todayPlan?.today.type)
    : null;

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  useEffect(() => {
    if (dashboardState === 'flexible') {
      fetchUserTemplates(1, true);
    }
  }, [dashboardState, fetchUserTemplates]);

  // ─── Navigation callbacks ───────────────────────────────────────────────────
  const goToProfile = useCallback(
    () => (navigation as any).navigate('ProfileTab'),
    [navigation],
  );
  const goToProgress = useCallback(
    () => (navigation as any).navigate('ProgressTab'),
    [navigation],
  );
  const goToPreviousSession = useCallback(async () => {
    try {
      const result = await getSessionHistory({ page: 1, limit: 1 });
      const sessions = result?.data ?? [];
      if (sessions.length > 0) {
        (navigation as any).navigate('ProgressTab', {
          screen: 'PastSessionDetail',
          params: { sessionId: sessions[0]._id },
        });
        return;
      }
    } catch {}
    (navigation as any).navigate('ProgressTab');
  }, [navigation]);
  const goToQuickStart = useCallback(
    () =>
      (navigation as any).navigate('WorkoutsTab', {
        screen: 'WorkoutHub',
        params: { mode: 'quickStart' },
      }),
    [navigation],
  );
  const goToStartWorkout = useCallback(async () => {
    // Start directly from today's plan template if available
    const template = data?.todayPlan?.today?.template;
    try {
      await startSession(template?.name, template?._id);
    } catch {
      // If session start fails, fall through to WorkoutHub
    }
    (navigation as any).navigate('WorkoutsTab', { screen: 'ActiveSession' });
  }, [navigation, data, startSession]);
  const goToSwap = useCallback(
    () =>
      (navigation as any).navigate('WorkoutsTab', {
        screen: 'WorkoutHub',
        params: {
          mode: 'swap',
          currentWorkoutName:
            data?.todayPlan?.today?.template?.name ?? data?.todayPlan?.planName,
        },
      }),
    [navigation, data],
  );
  const goToPlanDetail = useCallback(() => {
    if (!data?.todayPlan) return;
    (navigation as any).navigate('ProfileTab', {
      screen: 'PlanDetail',
      params: { planId: data.todayPlan.planId },
    });
  }, [navigation, data]);
  const goToPlanCreator = useCallback(
    () =>
      (navigation as any).navigate('ProfileTab', { screen: 'PlanCreator' }),
    [navigation],
  );

  // ─── Loading / error states ─────────────────────────────────────────────────
  if (isLoading && !data) {
    return <LoadingSpinner fullScreen />;
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load dashboard</Text>
          <Button
            label="Retry"
            onPress={fetchDashboard}
            variant="secondary"
            style={styles.retryBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── FTU Welcome ────────────────────────────────────────────────────────────
  if (dashboardState === 'ftu' || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.container, styles.ftuContainer]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ftuHero}>
            <Text style={styles.ftuEmoji}>🏋️</Text>
            <Text style={styles.ftuTitle}>Welcome,{'\n'}{firstName}!</Text>
            <Text style={styles.ftuSubtitle}>
              Your fitness journey starts today.{'\n'}Log your first workout to build your streak.
            </Text>
          </View>
          <View style={styles.ctaStack}>
            <Button label="Quick Start" onPress={goToQuickStart} />
            <Button
              label="Create Your Own"
              onPress={() => openOverlay('createWorkoutChooser')}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={isLoading}
      onRefresh={fetchDashboard}
      tintColor={colors.primary}
      progressBackgroundColor={colors.surfaceContainerHigh}
    />
  );

  // ─── Active Workout Day ──────────────────────────────────────────────────────
  if (dashboardState === 'workoutDay') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <DashboardHeader firstName={firstName} onPress={goToProfile} />
          <StreakBadge current={data.streak.current} onPress={goToProgress} />
          {data.todayPlan && <TodayPlanCard todayPlan={data.todayPlan} />}
          <XPLevelCard totalXP={data.xp.total} onPress={goToProfile} />
          <WeeklyVolumeChart
            volumeByDay={data.volumeByDay}
            weeklyVolume={data.weeklyVolume}
          />
          {data.lastWorkout && (
            <PreviousSessionCard
              lastWorkout={data.lastWorkout}
              onPress={goToPreviousSession}
            />
          )}
          <View style={styles.ctaStack}>
            <Button label="START WORKOUT" onPress={goToStartWorkout} />
            <Button label="Change Workout" onPress={goToSwap} variant="tertiary" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Rest Day ────────────────────────────────────────────────────────────────
  if (dashboardState === 'restDay') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <DashboardHeader firstName={firstName} onPress={goToProfile} />
          <StreakBadge current={data.streak.current} onPress={goToProgress} />
          <View style={styles.restCard}>
            <View style={styles.restLeft}>
              <Text style={styles.restTag}>REST DAY</Text>
              <Text style={styles.restTitle}>Recovery Mode</Text>
              <Text style={styles.restSub}>Next workout tomorrow — keep the streak alive</Text>
            </View>
            <Text style={styles.restIcon}>🌙</Text>
          </View>
          <XPLevelCard totalXP={data.xp.total} onPress={goToProfile} />
          {data.lastWorkout && (
            <PreviousSessionCard
              lastWorkout={data.lastWorkout}
              onPress={goToPreviousSession}
            />
          )}
          <View style={styles.ctaStack}>
            <Button label="View Plan" onPress={goToPlanDetail} variant="secondary" />
            <Button
              label="Browse Exercises"
              onPress={() => openOverlay('exercisePicker', { context: 'session' })}
              variant="tertiary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Flexible (no active plan, has history) ───────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader firstName={firstName} onPress={goToProfile} />
        <StreakBadge current={data.streak.current} onPress={goToProgress} />
        <XPLevelCard totalXP={data.xp.total} onPress={goToProfile} />
        <WeeklyVolumeChart
          volumeByDay={data.volumeByDay}
          weeklyVolume={data.weeklyVolume}
        />
        {data.lastWorkout && (
          <PreviousSessionCard
            lastWorkout={data.lastWorkout}
            onPress={goToPreviousSession}
          />
        )}

        {userTemplates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Templates</Text>
            {userTemplates.slice(0, 4).map((t: WorkoutTemplate) => (
              <TouchableOpacity
                key={t._id}
                style={styles.templateRow}
                onPress={() => (navigation as any).navigate('WorkoutsTab', {
                  screen: 'TemplateDetail',
                  params: { templateId: t._id },
                })}
                activeOpacity={0.75}
              >
                <View style={styles.templateLeft}>
                  <Text style={styles.templateName}>{t.name}</Text>
                  <Text style={styles.templateMeta}>
                    {t.exercises.length} exercise{t.exercises.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={async () => {
                    try {
                      await startSession(t.name, t._id);
                      (navigation as any).navigate('WorkoutsTab', { screen: 'ActiveSession' });
                    } catch {
                      (navigation as any).navigate('WorkoutsTab', { screen: 'TemplateDetail', params: { templateId: t._id } });
                    }
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.playIcon}>▶</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.ctaStack}>
          <Button label="Set Up a Plan" onPress={goToPlanCreator} />
          <Button label="Quick Start" onPress={goToQuickStart} variant="tertiary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.md,
    gap: spacing.md,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  greeting: {
    gap: 1,
  },
  greetingTime: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  // ── FTU ───────────────────────────────────────────────────────────────────
  ftuContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  ftuHero: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.lg,
  },
  ftuEmoji: {
    fontSize: 64,
  },
  ftuTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 42,
  },
  ftuSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Rest Day card ─────────────────────────────────────────────────────────
  restCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  restLeft: {
    flex: 1,
    gap: 4,
  },
  restTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.tertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  restTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  restSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  restIcon: {
    fontSize: 44,
  },

  // ── Flexible — templates section ──────────────────────────────────────────
  section: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.md,
  },
  templateLeft: {
    flex: 1,
    gap: 2,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  templateMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 12,
    color: colors.onPrimary,
    marginLeft: 2,
  },

  // ── CTA stack ─────────────────────────────────────────────────────────────
  ctaStack: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['3xl'],
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    width: 160,
  },
});
