import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import ProgressBar from '../common/ProgressBar';
import type { TodayPlan } from '../../types/api';

interface Props {
  todayPlan: TodayPlan;
}

export default function TodayPlanCard({ todayPlan }: Props) {
  const { planName, currentIndex, totalDays, today, skippedDays } = todayPlan;
  const workoutName = today.label ?? today.template?.name ?? 'Workout';
  const progress = totalDays > 0 ? currentIndex / totalDays : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.tag}>TODAY'S SESSION</Text>
        {skippedDays > 0 && (
          <Text style={styles.warning}>
            {skippedDays}d behind
          </Text>
        )}
      </View>
      <Text style={styles.planName}>{planName}</Text>
      <Text style={styles.workoutName}>{workoutName}</Text>
      <View style={styles.progressBlock}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Day {currentIndex + 1} of {totalDays}</Text>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar progress={progress} height={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  warning: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  planName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  progressBlock: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressPct: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
