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
import PRBadge from '../../components/progress/PRBadge';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { formatDuration } from '../../utils/time';
import type { ProgressScreenProps } from '../../navigation/types';
import type { SessionDetailExercise, SessionDetailSet } from '../../types/api';

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k kg`;
  return `${v} kg`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SetRow({ set, index, exercisePRs }: {
  set: SessionDetailSet;
  index: number;
  exercisePRs: Set<string>;
}) {
  const isPR = set.isPR || (exercisePRs.has('weight') && set.weight != null);
  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>{index + 1}</Text>
      <View style={styles.setValues}>
        {set.weight != null && <Text style={styles.setValue}>{set.weight} kg</Text>}
        {set.reps != null && <Text style={styles.setValue}>{set.reps} reps</Text>}
        {set.durationSeconds != null && (
          <Text style={styles.setValue}>{formatDuration(set.durationSeconds)}</Text>
        )}
        {set.distance != null && <Text style={styles.setValue}>{set.distance} m</Text>}
      </View>
      {isPR && <PRBadge type="weight" compact />}
    </View>
  );
}

function ExerciseSection({ exercise, sessionPRs }: {
  exercise: SessionDetailExercise;
  sessionPRs: Array<{ exercise: string; type: string; value: number }>;
}) {
  const exId = typeof exercise.exercise === 'object' ? exercise.exercise._id : exercise.exercise;
  const prTypes = new Set(sessionPRs.filter(pr => pr.exercise === exId).map(pr => pr.type));
  const completedSets = exercise.sets.filter(s => s.completed);

  return (
    <View style={styles.exerciseSection}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>
          {typeof exercise.exercise === 'object' ? exercise.exercise.name : 'Exercise'}
        </Text>
        {prTypes.size > 0 && (
          <View style={styles.prRow}>
            {Array.from(prTypes).map(type => (
              <PRBadge key={type} type={type} compact />
            ))}
          </View>
        )}
      </View>

      <View style={styles.exerciseSummary}>
        <Text style={styles.exerciseSummaryText}>
          {completedSets.length} sets
          {(exercise.summary?.bestWeight ?? 0) > 0 && ` · Best: ${exercise.summary.bestWeight} kg × ${exercise.summary.bestReps}`}
          {(exercise.summary?.volume ?? 0) > 0 && ` · ${formatVolume(exercise.summary.volume)}`}
        </Text>
      </View>

      {completedSets.map((set, i) => (
        <SetRow key={i} set={set} index={i} exercisePRs={prTypes} />
      ))}
    </View>
  );
}

function SkippedExerciseRow({ exercise }: { exercise: SessionDetailExercise }) {
  const name = typeof exercise.exercise === 'object' ? exercise.exercise.name : 'Exercise';
  return (
    <View style={styles.skippedRow}>
      <Text style={styles.skippedName}>{name}</Text>
      <View style={styles.skippedBadge}>
        <Text style={styles.skippedBadgeText}>SKIPPED</Text>
      </View>
    </View>
  );
}

export default function PastSessionDetailScreen({ navigation, route }: ProgressScreenProps<'PastSessionDetail'>) {
  const { sessionId } = route.params;
  const { currentSession, isSessionLoading, fetchSessionById } = useProgressStore();

  useEffect(() => {
    fetchSessionById(sessionId);
  }, [sessionId]);

  if (isSessionLoading || !currentSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <ActivityIndicator
          color={colors.primary}
          size="large"
          style={{ marginTop: spacing['4xl'] }}
        />
      </SafeAreaView>
    );
  }

  const session = currentSession;
  const prs = session.sessionSummary?.personalRecords ?? [];
  const totalVolume = session.sessionSummary?.totalVolume ?? 0;
  const totalSets = session.sessionSummary?.totalSets ?? 0;
  const totalExercises = session.sessionSummary?.totalExercises ?? 0;
  const duration = session.durationSeconds ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.sessionName}>{session.name}</Text>
          <Text style={styles.sessionDate}>{formatDate(session.startedAt)}</Text>
        </View>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <StatPill label="DURATION" value={formatDuration(duration)} />
          <StatPill label="VOLUME" value={formatVolume(totalVolume)} />
          <StatPill label="SETS" value={String(totalSets)} />
          <StatPill label="EXERCISES" value={String(totalExercises)} />
        </View>

        {/* PR summary */}
        {prs.length > 0 && (
          <View style={styles.prSummaryCard}>
            <Text style={styles.prSummaryTitle}>PERSONAL RECORDS</Text>
            <View style={styles.prBadgeRow}>
              {prs.map((pr, i) => (
                <PRBadge key={i} type={pr.type} />
              ))}
            </View>
          </View>
        )}

        {/* Exercise breakdown */}
        {(() => {
          const done = session.exercises.filter(ex => ex.sets.filter(s => s.completed).length > 0);
          const skipped = session.exercises.filter(ex => ex.sets.filter(s => s.completed).length === 0);
          return (
            <>
              {done.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>EXERCISES</Text>
                  {done.map((ex, i) => (
                    <ExerciseSection key={i} exercise={ex} sessionPRs={prs} />
                  ))}
                </>
              )}
              {skipped.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>SKIPPED ({skipped.length})</Text>
                  <View style={styles.skippedCard}>
                    {skipped.map((ex, i) => (
                      <SkippedExerciseRow key={i} exercise={ex} />
                    ))}
                  </View>
                </>
              )}
            </>
          );
        })()}
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
  sessionName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 32,
  },
  sessionDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
  },

  // PR summary
  prSummaryCard: {
    backgroundColor: `${colors.primary}0F`,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  prSummaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  prBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Exercise
  exerciseSection: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    letterSpacing: 0.1,
  },
  prRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  exerciseSummary: {
    paddingBottom: 2,
  },
  exerciseSummaryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Skipped exercises
  skippedCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  skippedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skippedName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
  },
  skippedBadge: {
    backgroundColor: `${colors.warning}18`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skippedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.warning,
    letterSpacing: 1,
  },

  // Set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  setNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    width: 20,
    textAlign: 'center',
  },
  setValues: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  setValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
