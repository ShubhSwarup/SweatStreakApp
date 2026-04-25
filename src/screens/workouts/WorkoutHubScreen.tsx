import React, { useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTemplateStore } from '../../store/templateStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useSessionStore } from '../../store/sessionStore';
import { usePlanStore } from '../../store/planStore';
import { useUIStore } from '../../store/uiStore';
import { useSessionTimer, formatElapsed } from '../../hooks/useSessionTimer';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import type { WorkoutTemplate } from '../../types/api';
import type { WorkoutsScreenProps } from '../../navigation/types';

type HubMode = 'default' | 'quickStart' | 'plan' | 'swap' | 'resume';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateDuration(template: WorkoutTemplate): string {
  const totalSets = template.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const mins = Math.max(10, Math.round(totalSets * 2.5));
  return `~${mins} min`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <Text style={styles.sectionCount}>{count}</Text>
      )}
    </View>
  );
}

interface TemplateCardProps {
  template: WorkoutTemplate;
  onPress: (template: WorkoutTemplate) => void;
  onPlay: (template: WorkoutTemplate) => void;
  highlighted?: boolean;
}

function TemplateCard({ template, onPress, onPlay, highlighted }: TemplateCardProps) {
  return (
    <TouchableOpacity
      style={[styles.templateCard, highlighted && styles.templateCardHighlighted]}
      onPress={() => onPress(template)}
      activeOpacity={0.8}
    >
      <View style={styles.templateLeft}>
        <View style={styles.templateTitleRow}>
          <Text style={styles.templateName} numberOfLines={1}>
            {template.name}
          </Text>
          {template.isSystem && <Badge label="System" variant="default" />}
          {highlighted && <Badge label="Suggested" variant="primary" />}
        </View>
        <Text style={styles.templateMeta}>
          {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
          {'  ·  '}
          {estimateDuration(template)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.playBtn}
        onPress={() => onPlay(template)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.playIcon}>▶</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function WorkoutHubScreen({ navigation, route }: WorkoutsScreenProps<'WorkoutHub'>) {
  const params = route.params;

  const { userTemplates, systemTemplates, isLoading, fetchUserTemplates, fetchSystemTemplates } =
    useTemplateStore();
  const { suggestedExercises, fetchSuggested } = useExerciseStore();
  const { startSession, isStarting, activeSession } = useSessionStore();
  const { todayPlan, plans, fetchTodayPlan, fetchPlans } = usePlanStore();
  const openOverlay = useUIStore(state => state.openOverlay);

  const elapsed = useSessionTimer(
    activeSession?.durationSeconds ?? 0,
    activeSession?.status === 'active',
  );

  useEffect(() => {
    fetchUserTemplates(1, true);
    fetchSystemTemplates(1, true);
    fetchSuggested(undefined, 8);
  }, [fetchUserTemplates, fetchSystemTemplates, fetchSuggested]);

  useFocusEffect(
    useCallback(() => {
      fetchTodayPlan();
      fetchPlans();
    }, [fetchTodayPlan, fetchPlans]),
  );

  // Mode resolution — priority: active session > nav param > plan today > default
  const resolvedMode: HubMode = useMemo(() => {
    if (activeSession !== null) return 'resume';
    if (params?.mode && params.mode !== 'default') return params.mode;
    if (todayPlan?.today.type === 'workout') return 'plan';
    return 'default';
  }, [activeSession, params?.mode, todayPlan]);

  // ─── Navigation / action callbacks ───────────────────────────────────────

  const goToDetail = useCallback(
    (template: WorkoutTemplate) => {
      navigation.navigate('TemplateDetail', { templateId: template._id });
    },
    [navigation],
  );

  const handlePlay = useCallback(
    async (template: WorkoutTemplate) => {
      await startSession(template.name, template._id);
      navigation.navigate('ActiveSession');
    },
    [startSession, navigation],
  );

  const handleResume = useCallback(() => {
    navigation.navigate('ActiveSession');
  }, [navigation]);

  const handlePlus = useCallback(() => openOverlay('createWorkoutChooser'), [openOverlay]);

  const handleStartEmpty = useCallback(async () => {
    await startSession('Quick Workout');
    navigation.navigate('ActiveSession');
  }, [startSession, navigation]);

  const handleStartTodayPlan = useCallback(async () => {
    const template = todayPlan?.today?.template;
    await startSession(template?.name ?? todayPlan?.planName, template?._id);
    navigation.navigate('ActiveSession');
  }, [startSession, navigation, todayPlan]);

  const handleSwapSelect = useCallback(
    (template: WorkoutTemplate) => {
      Alert.alert(
        'Start This Workout?',
        `Replace current workout with "${template.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            style: 'default',
            onPress: async () => {
              await startSession(template.name, template._id);
              navigation.navigate('ActiveSession');
            },
          },
        ],
      );
    },
    [startSession, navigation],
  );

  const handleSwapCancel = useCallback(() => {
    (navigation as any).navigate('DashboardTab');
  }, [navigation]);

  // ─── Render ───────────────────────────────────────────────────────────────

  // ── Resume mode ──────────────────────────────────────────────────────────
  if (resolvedMode === 'resume' && activeSession !== null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workouts</Text>
          <TouchableOpacity style={styles.plusBtn} onPress={handlePlus}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.resumeCard} onPress={handleResume} activeOpacity={0.85}>
            <View style={styles.resumeLeft}>
              <Text style={[
                styles.resumeTag,
                activeSession.status === 'active' && styles.resumeTagActive,
              ]}>
                {activeSession.status === 'paused' ? 'PAUSED' : 'IN PROGRESS'}
              </Text>
              <Text style={styles.resumeName}>{activeSession.name}</Text>
              <Text style={styles.resumeTime}>{formatElapsed(elapsed)}</Text>
            </View>
            <TouchableOpacity
              style={styles.dotsBtn}
              onPress={() => openOverlay('sessionAction')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.dotsIcon}>•••</Text>
            </TouchableOpacity>
            <View style={[
              styles.resumeBtn,
              activeSession.status === 'active' && styles.resumeBtnActive,
            ]}>
              <Text style={styles.resumeBtnText}>
                {activeSession.status === 'paused' ? 'Resume ›' : 'Return ›'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <SectionHeader title="YOUR TEMPLATES" count={userTemplates.length} />
            {userTemplates.slice(0, 5).map(t => (
              <TemplateCard key={t._id} template={t} onPress={goToDetail} onPlay={handlePlay} />
            ))}
          </View>

          {systemTemplates.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="SYSTEM TEMPLATES" count={systemTemplates.length} />
              {systemTemplates.slice(0, 5).map(t => (
                <TemplateCard key={t._id} template={t} onPress={goToDetail} onPlay={handlePlay} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Quick Start mode ─────────────────────────────────────────────────────
  if (resolvedMode === 'quickStart') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quick Start</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isStarting && (
            <View style={styles.startingBanner}>
              <ActivityIndicator color={colors.onPrimary} size="small" />
              <Text style={styles.startingText}>Starting workout…</Text>
            </View>
          )}

          <View style={styles.emptyStartCard}>
            <Text style={styles.emptyStartTitle}>Start Fresh</Text>
            <Text style={styles.emptyStartSub}>
              Begin with an empty session and add exercises as you go.
            </Text>
            <Button label="Start Empty Workout" onPress={handleStartEmpty} style={styles.emptyStartBtn} />
          </View>

          {isLoading && systemTemplates.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : systemTemplates.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="OR PICK A TEMPLATE" count={systemTemplates.length} />
              {systemTemplates.map((t, idx) => (
                <TemplateCard
                  key={t._id}
                  template={t}
                  onPress={goToDetail}
                  onPlay={handlePlay}
                  highlighted={idx < 3}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Plan mode ────────────────────────────────────────────────────────────
  if (resolvedMode === 'plan' && todayPlan) {
    const template = todayPlan.today.template;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workouts</Text>
          <TouchableOpacity style={styles.plusBtn} onPress={handlePlus}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isStarting && (
            <View style={styles.startingBanner}>
              <ActivityIndicator color={colors.onPrimary} size="small" />
              <Text style={styles.startingText}>Starting workout…</Text>
            </View>
          )}

          {/* Today's plan card */}
          <View style={styles.todayCard}>
            <View style={styles.todayCardHeader}>
              <View>
                <Text style={styles.todayTag}>TODAY'S WORKOUT</Text>
                <Text style={styles.todayPlanName}>{todayPlan.planName}</Text>
              </View>
              <Text style={styles.todayDayBadge}>
                Day {todayPlan.currentIndex + 1}/{todayPlan.totalDays}
              </Text>
            </View>
            {template ? (
              <View style={styles.todayTemplatePreview}>
                <Text style={styles.todayTemplateName}>{template.name}</Text>
                {todayPlan.today.label ? (
                  <Text style={styles.todayLabel}>{todayPlan.today.label}</Text>
                ) : null}
                <Text style={styles.todayTemplateMeta}>
                  {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                  {'  ·  '}
                  {estimateDuration(template)}
                </Text>
              </View>
            ) : null}
            <Button
              label="Start This Workout"
              onPress={handleStartTodayPlan}
              style={styles.startTodayBtn}
            />
          </View>

          {/* Templates as secondary option */}
          {userTemplates.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="OR CHOOSE A TEMPLATE" count={userTemplates.length} />
              {userTemplates.slice(0, 5).map(t => (
                <TemplateCard key={t._id} template={t} onPress={goToDetail} onPlay={handlePlay} />
              ))}
            </View>
          )}

          {systemTemplates.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="SYSTEM TEMPLATES" count={systemTemplates.length} />
              {systemTemplates.slice(0, 5).map(t => (
                <TemplateCard key={t._id} template={t} onPress={goToDetail} onPlay={handlePlay} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Swap mode ────────────────────────────────────────────────────────────
  if (resolvedMode === 'swap') {
    const currentName = params?.currentWorkoutName ?? 'current workout';
    const allTemplates = [...userTemplates, ...systemTemplates];
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Workout</Text>
          <TouchableOpacity onPress={handleSwapCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.swapBanner}>
          <Text style={styles.swapBannerLabel}>REPLACING</Text>
          <Text style={styles.swapBannerName} numberOfLines={1}>{currentName}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isStarting && (
            <View style={styles.startingBanner}>
              <ActivityIndicator color={colors.onPrimary} size="small" />
              <Text style={styles.startingText}>Starting workout…</Text>
            </View>
          )}

          {isLoading && allTemplates.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <>
              {userTemplates.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="YOUR TEMPLATES" count={userTemplates.length} />
                  {userTemplates.map(t => (
                    <TemplateCard
                      key={t._id}
                      template={t}
                      onPress={handleSwapSelect}
                      onPlay={handleSwapSelect}
                    />
                  ))}
                </View>
              )}

              {systemTemplates.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="SYSTEM TEMPLATES" count={systemTemplates.length} />
                  {systemTemplates.map(t => (
                    <TemplateCard
                      key={t._id}
                      template={t}
                      onPress={handleSwapSelect}
                      onPlay={handleSwapSelect}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Default mode ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
        <TouchableOpacity style={styles.plusBtn} onPress={handlePlus}>
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && userTemplates.length === 0 && systemTemplates.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}

        {isStarting && (
          <View style={styles.startingBanner}>
            <ActivityIndicator color={colors.onPrimary} size="small" />
            <Text style={styles.startingText}>Starting workout…</Text>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="YOUR TEMPLATES" count={userTemplates.length} />
          {userTemplates.length === 0 && !isLoading ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No templates yet</Text>
              <TouchableOpacity onPress={handlePlus}>
                <Text style={styles.emptyAction}>Create your first →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            userTemplates.slice(0, 5).map(t => (
              <TemplateCard key={t._id} template={t} onPress={goToDetail} onPlay={handlePlay} />
            ))
          )}
        </View>

        {systemTemplates.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="SYSTEM TEMPLATES" count={systemTemplates.length} />
            {systemTemplates.slice(0, 5).map(t => (
              <TemplateCard key={t._id} template={t} onPress={goToDetail} onPlay={handlePlay} />
            ))}
          </View>
        )}

        {suggestedExercises.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="SUGGESTED EXERCISES" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedRow}
            >
              {suggestedExercises.map(ex => (
                <TouchableOpacity
                  key={ex._id}
                  style={styles.suggestedChip}
                  onPress={() => openOverlay('exerciseDetail', { exerciseId: ex._id, context: 'session' })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestedName} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.suggestedMuscle}>{ex.muscleGroup.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="YOUR PLANS" count={plans.length} />
          {plans.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No plans yet</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PlanCreator')}>
                <Text style={styles.emptyAction}>Build a training plan →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            plans.slice(0, 3).map(plan => (
              <TouchableOpacity
                key={plan._id}
                style={styles.templateCard}
                onPress={() => (navigation as any).navigate('ProfileTab', {
                  screen: 'PlanDetail',
                  params: { planId: plan._id },
                })}
                activeOpacity={0.8}
              >
                <View style={styles.templateLeft}>
                  <View style={styles.templateTitleRow}>
                    <Text style={styles.templateName} numberOfLines={1}>{plan.name}</Text>
                    {plan.isActive && <Badge label="Active" variant="primary" />}
                  </View>
                  <Text style={styles.templateMeta}>
                    {plan.days.length} day{plan.days.length !== 1 ? 's' : ''}
                    {'  ·  '}
                    {plan.days.filter(d => d.type === 'workout').length} workouts
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 22,
    color: colors.onPrimary,
    fontWeight: '400',
    lineHeight: 26,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.xl,
  },
  loadingContainer: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  startingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  startingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onPrimary,
  },

  // Resume card
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}18`,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resumeLeft: {
    flex: 1,
    gap: 3,
  },
  resumeTag: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warning,
    letterSpacing: 1.5,
  },
  resumeTagActive: {
    color: colors.primary,
  },
  resumeName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  resumeTime: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  dotsBtn: {
    paddingHorizontal: spacing.sm,
  },
  dotsIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '700',
  },
  resumeBtn: {
    backgroundColor: colors.warning,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resumeBtnActive: {
    backgroundColor: colors.primary,
  },
  resumeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },

  // Swap mode banner
  swapBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 2,
  },
  swapBannerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warning,
    letterSpacing: 1.5,
  },
  swapBannerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  // Today's plan card (plan mode)
  todayCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  todayTag: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  todayPlanName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  todayDayBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  todayTemplatePreview: {
    gap: 3,
  },
  todayTemplateName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  todayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  todayTemplateMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  startTodayBtn: {
    marginTop: spacing.xs,
  },

  // Quick Start empty start card
  emptyStartCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  emptyStartTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  emptyStartSub: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyStartBtn: {
    alignSelf: 'stretch',
  },

  // Section
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },

  // Template card
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  templateCardHighlighted: {
    backgroundColor: `${colors.primary}18`,
  },
  templateLeft: {
    flex: 1,
    gap: 4,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  templateName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  templateMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 14,
    color: colors.onPrimary,
    marginLeft: 2,
  },

  // Suggested exercises
  suggestedRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  suggestedChip: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
    minWidth: 100,
  },
  suggestedName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  suggestedMuscle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },

  // Empty states
  emptySection: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyAction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
