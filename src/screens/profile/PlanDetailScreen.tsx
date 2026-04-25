import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlanStore } from '../../store/planStore';
import ProgressBar from '../../components/common/ProgressBar';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { PlanDay } from '../../types/api';
import type { ProfileScreenProps } from '../../navigation/types';

function DayRow({
  day,
  isCurrent,
  isCompleted,
}: {
  day: PlanDay;
  isCurrent: boolean;
  isCompleted: boolean;
}) {
  const isWorkout = day.type === 'workout';
  const exerciseCount = day.template?.exercises?.length ?? 0;

  return (
    <View style={[
      styles.dayRow,
      isCurrent && styles.dayRowCurrent,
      isCompleted && styles.dayRowCompleted,
    ]}>
      <View style={[styles.dayIcon, isCurrent && styles.dayIconCurrent]}>
        <Text style={styles.dayIconText}>{isWorkout ? '🏋️' : '💤'}</Text>
      </View>
      <View style={styles.dayInfo}>
        <View style={styles.dayTitleRow}>
          <Text style={[styles.dayOrder, isCurrent && styles.dayOrderCurrent]}>
            Day {day.order}
          </Text>
          {isCurrent && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>TODAY</Text>
            </View>
          )}
          {isCompleted && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
        <Text style={[styles.dayType, isCurrent && styles.dayTypeCurrent]}>
          {day.label ? day.label : (isWorkout ? 'Workout Day' : 'Rest Day')}
        </Text>
        {isWorkout && exerciseCount > 0 && (
          <Text style={styles.dayMeta}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function PlanDetailScreen({ route, navigation }: ProfileScreenProps<'PlanDetail'>) {
  const { planId } = route.params;
  const { selectedPlan, isLoading, error, fetchPlanById } = usePlanStore();

  useEffect(() => {
    fetchPlanById(planId);
  }, [planId, fetchPlanById]);

  const plan = selectedPlan?._id === planId ? selectedPlan : null;

  const handleEdit = useCallback(() => {
    navigation.navigate('PlanCreator', { planId });
  }, [navigation, planId]);

  const handleSkip = useCallback(() => {
    Alert.alert('Coming Soon', 'Skip day will be available in a future update.');
  }, []);

  const handleRestart = useCallback(() => {
    Alert.alert('Coming Soon', 'Restart plan will be available in a future update.');
  }, []);

  const headerOnly = (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1} />
      <View style={styles.editPlaceholder} />
    </View>
  );

  if (error && !plan) {
    return (
      <SafeAreaView style={styles.safe}>
        {headerOnly}
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load plan</Text>
          <Button
            label="Retry"
            onPress={() => fetchPlanById(planId)}
            variant="secondary"
            style={styles.retryBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !plan) {
    return (
      <SafeAreaView style={styles.safe}>
        {headerOnly}
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const sortedDays = [...plan.days].sort((a, b) => a.order - b.order);
  const completedCount = plan.currentDayIndex;
  const totalDays = plan.days.length;
  const progress = totalDays > 0 ? completedCount / totalDays : 0;
  const currentDay = sortedDays[plan.currentDayIndex] ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{plan.name}</Text>
        <TouchableOpacity
          onPress={handleEdit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressLabel}>PROGRESS</Text>
              <Text style={styles.progressCount}>{completedCount} of {totalDays} days done</Text>
            </View>
            <View style={[styles.activeBadge, !plan.isActive && styles.inactiveBadge]}>
              <Text style={[styles.activeBadgeText, !plan.isActive && styles.inactiveBadgeText]}>
                {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
          <ProgressBar progress={progress} height={8} />
          {currentDay && (
            <View style={styles.currentDayHint}>
              <Text style={styles.currentDayHintLabel}>NEXT UP</Text>
              <Text style={styles.currentDayHintValue}>
                Day {currentDay.order} — {currentDay.label ?? (currentDay.type === 'workout' ? 'Workout' : 'Rest')}
              </Text>
            </View>
          )}
        </View>

        {/* Days list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCHEDULE</Text>
          {sortedDays.map((day, index) => (
            <DayRow
              key={day._id}
              day={day}
              isCurrent={index === plan.currentDayIndex}
              isCompleted={index < plan.currentDayIndex}
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>ACTIONS</Text>

          <TouchableOpacity onPress={handleSkip} activeOpacity={0.75}>
            <View style={styles.disabledAction}>
              <View style={styles.disabledActionLeft}>
                <Text style={styles.disabledActionTitle}>Skip Today</Text>
                <Text style={styles.disabledActionSub}>Advance to the next workout day</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestart} activeOpacity={0.75}>
            <View style={styles.disabledAction}>
              <View style={styles.disabledActionLeft}>
                <Text style={styles.disabledActionTitle}>Restart Plan</Text>
                <Text style={styles.disabledActionSub}>Reset to Day 1 and start over</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </View>
          </TouchableOpacity>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  editText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 60,
    textAlign: 'right',
  },
  editPlaceholder: {
    minWidth: 60,
  },

  // Loading / Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['3xl'],
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    width: 160,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.xl,
  },

  // Progress card
  progressCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  progressCount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  activeBadge: {
    backgroundColor: `${colors.primary}22`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  inactiveBadge: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  inactiveBadgeText: {
    color: colors.textMuted,
  },
  currentDayHint: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  currentDayHintLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  currentDayHintValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },

  // Section
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },

  // Day row
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dayRowCurrent: {
    backgroundColor: `${colors.primary}14`,
  },
  dayRowCompleted: {
    opacity: 0.55,
  },
  dayIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconCurrent: {
    backgroundColor: `${colors.primary}30`,
  },
  dayIconText: {
    fontSize: 18,
  },
  dayInfo: {
    flex: 1,
    gap: 3,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayOrder: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayOrderCurrent: {
    color: colors.text,
  },
  todayBadge: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 1,
  },
  checkmark: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  dayType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayTypeCurrent: {
    color: colors.text,
    fontWeight: '700',
  },
  dayMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Actions section
  actionsSection: {
    gap: spacing.sm,
  },
  disabledAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
    opacity: 0.6,
  },
  disabledActionLeft: {
    flex: 1,
    gap: 3,
  },
  disabledActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  disabledActionSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
});
