import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore } from '../../store/progressStore';
import { useExerciseStore } from '../../store/exerciseStore';
import ExerciseProgressChart from '../../components/progress/ExerciseProgressChart';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { ProgressScreenProps } from '../../navigation/types';

const ACTION_LABELS = {
  increase: '↑ Ready to increase weight',
  hold: '→ Hold current weight',
  decrease: '↓ Consider reducing weight',
};

const ACTION_COLORS = {
  increase: colors.primary,
  hold: colors.tertiary,
  decrease: colors.warning,
};

function StatBox({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

export default function ExerciseProgressDetailScreen({
  navigation,
  route,
}: ProgressScreenProps<'ExerciseProgressDetail'>) {
  const { exerciseId } = route.params;
  const { fetchExerciseById, selectedExercise } = useExerciseStore();
  const {
    exerciseStats,
    exerciseProgression,
    exerciseTimeSeries,
    isExerciseProgressLoading,
    fetchExerciseProgress,
  } = useProgressStore();

  const exercise = selectedExercise?._id === exerciseId ? selectedExercise : null;

  useEffect(() => {
    fetchExerciseProgress(exerciseId);
    fetchExerciseById(exerciseId);
  }, [exerciseId]);

  if (isExerciseProgressLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={styles.exerciseName}>{exercise?.name ?? 'Exercise'}</Text>
          {exercise && (
            <Text style={styles.exerciseMeta}>
              {exercise.muscleGroup} · {exercise.exerciseType}
            </Text>
          )}
        </View>

        {/* Current stats */}
        {exerciseStats ? (
          <View style={styles.statsCard}>
            <Text style={styles.sectionLabel}>CURRENT STATS</Text>
            <View style={styles.statsGrid}>
              <StatBox label="BEST WEIGHT" value={String(exerciseStats.bestWeight)} unit="kg" />
              <StatBox label="BEST REPS" value={String(exerciseStats.bestReps)} unit="reps" />
              <StatBox label="LAST WEIGHT" value={String(exerciseStats.lastWeight)} unit="kg" />
              <StatBox label="EST. 1RM" value={exerciseStats.estimated1RM.toFixed(1)} unit="kg" />
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No stats yet — log your first set!</Text>
          </View>
        )}

        {/* Progression suggestion */}
        {exerciseProgression && (
          <View style={styles.progressionCard}>
            <Text style={styles.sectionLabel}>PROGRESSION SUGGESTION</Text>
            <Text
              style={[
                styles.progressionAction,
                { color: ACTION_COLORS[exerciseProgression.action] ?? colors.textSecondary },
              ]}
            >
              {ACTION_LABELS[exerciseProgression.action] ?? exerciseProgression.action}
            </Text>
            <View style={styles.progressionDetails}>
              <Text style={styles.progressionWeight}>
                {exerciseProgression.nextWeight} kg × {exerciseProgression.repRange}
              </Text>
            </View>
          </View>
        )}

        {/* Weight over time chart */}
        {exerciseTimeSeries.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionLabel}>WEIGHT OVER TIME</Text>
            <ExerciseProgressChart
              data={exerciseTimeSeries}
              field="weight"
              unit="kg"
              height={160}
            />
          </View>
        )}

        {/* Estimated 1RM trend */}
        {exerciseTimeSeries.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionLabel}>ESTIMATED 1RM TREND</Text>
            <ExerciseProgressChart
              data={exerciseTimeSeries}
              field="estimated1RM"
              unit="kg"
              height={160}
            />
          </View>
        )}

        {/* Volume trend */}
        {exerciseTimeSeries.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionLabel}>VOLUME TREND</Text>
            <ExerciseProgressChart
              data={exerciseTimeSeries}
              field="volume"
              unit="kg"
              height={160}
            />
          </View>
        )}

        {/* Best sets table */}
        {exerciseTimeSeries.length > 0 && (
          <View style={styles.bestSetsCard}>
            <Text style={styles.sectionLabel}>RECENT BEST SETS</Text>
            {exerciseTimeSeries
              .slice()
              .sort((a, b) => b.weight - a.weight)
              .slice(0, 5)
              .map((point, i) => (
                <View key={i} style={styles.bestSetRow}>
                  <Text style={styles.bestSetRank}>#{i + 1}</Text>
                  <Text style={styles.bestSetWeight}>
                    {point.weight} kg × {point.reps}
                  </Text>
                  <Text style={styles.bestSet1RM}>
                    {point.estimated1RM.toFixed(1)} kg e1RM
                  </Text>
                </View>
              ))}
          </View>
        )}

        {!exerciseStats && exerciseTimeSeries.length === 0 && !isExerciseProgressLoading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No history found for this exercise.</Text>
            <Text style={styles.emptySubText}>Log a set to start tracking progress.</Text>
          </View>
        )}
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
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  titleBlock: {
    gap: 4,
  },
  exerciseName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  exerciseMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  statsCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  statBox: {
    flex: 1,
    minWidth: '40%',
    gap: 3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  progressionCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  progressionAction: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressionDetails: {},
  progressionWeight: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  chartCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },

  bestSetsCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  bestSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  bestSetRank: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    width: 24,
  },
  bestSetWeight: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  bestSet1RM: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  emptyCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing['4xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
