import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Alert,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import SetRow, { type LogSetData } from './SetRow';
import type { SessionExercise } from '../../types/api';
import { log } from '../../utils/logger';

interface Props {
  exercise: SessionExercise;
  exerciseIndex: number;
  onLogSet: (exerciseIndex: number, data: LogSetData) => Promise<void>;
  onOpenCalculator: (weight: number) => void;
  onRemove: (exerciseIndex: number) => void;
  onRemovePendingSet: (setNumber: number) => Promise<void>;
  onUnlogCompletedSet: (setNumber: number) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

type CardMetrics = {
  cardPadding: number;
  rowGap: number;
  setNumWidth: number;
  checkSize: number;
  headerFontSize: number;
};

function getCardMetrics(screenWidth: number): CardMetrics {
  if (screenWidth <= 350) {
    return {
      cardPadding: 16,
      rowGap: 4,
      setNumWidth: 24,
      checkSize: 44,
      headerFontSize: 16,
    };
  }

  if (screenWidth <= 390) {
    return {
      cardPadding: 18,
      rowGap: 6,
      setNumWidth: 26,
      checkSize: 48,
      headerFontSize: 16,
    };
  }

  return {
    cardPadding: 22,
    rowGap: spacing.sm,
    setNumWidth: 28,
    checkSize: 52,
    headerFontSize: 17,
  };
}

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  onLogSet,
  onOpenCalculator,
  onRemove,
  onRemovePendingSet,
  onUnlogCompletedSet,
  onMoveUp,
  onMoveDown,
}: Props) {
  const { width } = useWindowDimensions();
  const metrics = getCardMetrics(width);

  const [isLoggingSet, setIsLoggingSet] = useState(false);
  const [extraSetCount, setExtraSetCount] = useState(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8,
      onPanResponderMove: (_e, { dx }) => {
        if (dx < 0) translateX.setValue(Math.max(dx, -72));
      },
      onPanResponderRelease: (_e, { dx }) => {
        if (dx < -36) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.spring(translateX, { toValue: -72, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const closeSwipe = () =>
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();

  const handleRemoveExercise = () => {
    closeSwipe();
    const name = exercise.name || 'this exercise';
    Alert.alert('Remove Exercise', `Remove "${name}" from this workout?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(exerciseIndex) },
    ]);
  };

  const handleLogPendingSet = async (data: LogSetData) => {
    setIsLoggingSet(true);
    try {
      await onLogSet(exerciseIndex, data);
    } finally {
      setIsLoggingSet(false);
    }
  };

  const handleLogExtraSet = async (data: LogSetData) => {
    setIsLoggingSet(true);
    try {
      await onLogSet(exerciseIndex, data);
      setExtraSetCount((c) => Math.max(0, c - 1));
    } finally {
      setIsLoggingSet(false);
    }
  };

  const handleRemoveExtraSet = () => {
    setExtraSetCount((c) => Math.max(0, c - 1));
  };

  const completedSets = exercise.sets.filter((s) => s.completed);
  const incompleteSets = exercise.sets.filter((s) => !s.completed);

  const totalVolume = completedSets.reduce((acc, s) => {
    if (s.weight != null && s.reps != null) return acc + s.weight * s.reps;
    return acc;
  }, 0);

  const suggestedWeight = exercise.suggestion?.weight ?? exercise.lastPerformance?.weight ?? null;
  const suggestedReps = exercise.suggestion?.reps ?? exercise.lastPerformance?.reps ?? null;

  const displayName = exercise.name || 'Exercise';
  if (!exercise.name) {
    log.warn('ExerciseCard', 'exercise.name empty for exerciseId=%s', exercise.exerciseId);
  }
  const trackingLabel = exercise.trackingType?.toUpperCase() ?? 'REPS';

  return (
    <View style={styles.swipeContainer}>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleRemoveExercise}>
        <Text style={styles.deleteBtnText}>Remove</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.card,
          {
            padding: metrics.cardPadding,
          },
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.accentStrip} pointerEvents="none" />
        <View style={[styles.header, { gap: metrics.rowGap }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.exerciseName, { fontSize: metrics.headerFontSize }]}>
              {displayName}
            </Text>
            <Text style={styles.muscleTag}>
              {trackingLabel}
              {exercise.lastPerformance && (
                <>
                  {'  ·  LAST: '}
                  {exercise.lastPerformance.weight != null
                    ? `${exercise.lastPerformance.weight} kg`
                    : 'BW'}
                  {exercise.lastPerformance.reps != null
                    ? ` × ${exercise.lastPerformance.reps}`
                    : ''}
                </>
              )}
            </Text>
            {completedSets.length > 0 && (
              <Text style={styles.volumeSummary}>
                {completedSets.length} {completedSets.length === 1 ? 'set' : 'sets'} done
                {totalVolume > 0 ? ` · ${totalVolume.toFixed(0)} kg total` : ''}
              </Text>
            )}
          </View>
          {exercise.suggestion && (
            <View
              style={[
                styles.suggestionBadge,
                exercise.suggestion.action === 'increase' && styles.suggestionIncrease,
              ]}
            >
              <Text style={styles.suggestionText}>
                {exercise.suggestion.action === 'increase' ? '↑' : '→'}{' '}
                {exercise.suggestion.weight}kg
              </Text>
            </View>
          )}
          {(onMoveUp !== undefined || onMoveDown !== undefined) && (
            <View style={styles.moveControls}>
              {onMoveUp !== undefined && (
                <TouchableOpacity
                  style={styles.moveBtn}
                  onPress={onMoveUp}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text style={styles.moveBtnText}>↑</Text>
                </TouchableOpacity>
              )}
              {onMoveDown !== undefined && (
                <TouchableOpacity
                  style={styles.moveBtn}
                  onPress={onMoveDown}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text style={styles.moveBtnText}>↓</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.progressDotsRow}>
          {exercise.sets.map((s, i) => (
            <View
              key={i}
              style={[styles.progressDot, s.completed && styles.progressDotActive]}
            />
          ))}
        </View>

        <View style={[styles.setHeaderRow, { gap: metrics.rowGap }]}>
          <Text style={[styles.setHeaderNum, { width: metrics.setNumWidth }]}>#</Text>
          {exercise.trackingType === 'reps' && (
            <>
              <Text style={styles.setHeaderLabel}>WEIGHT (kg)</Text>
              <Text style={styles.setHeaderLabel}>REPS</Text>
            </>
          )}
          {exercise.trackingType === 'time' && (
            <Text style={styles.setHeaderLabel}>DURATION (sec)</Text>
          )}
          {exercise.trackingType === 'distance' && (
            <Text style={styles.setHeaderLabel}>DISTANCE (km)</Text>
          )}
          <Text style={[styles.setHeaderDone, { width: metrics.checkSize }]}>DONE</Text>
        </View>

        {completedSets.map((s) => (
          <SetRow
            key={`done-${s.setNumber}`}
            setNumber={s.setNumber}
            set={s}
            trackingType={exercise.trackingType}
            onComplete={handleLogPendingSet}
            onUnlog={() => onUnlogCompletedSet(s.setNumber)}
          />
        ))}

        {incompleteSets.map((set, localIdx) => {
          const isActive = localIdx === 0;
          return (
            <SetRow
              key={`pending-${set.setNumber}`}
              setNumber={set.setNumber}
              set={set}
              trackingType={exercise.trackingType}
              suggestedWeight={suggestedWeight}
              suggestedReps={suggestedReps}
              onComplete={handleLogPendingSet}
              onRemove={() => onRemovePendingSet(set.setNumber)}
              onOpenCalculator={
                exercise.trackingType === 'reps' ? onOpenCalculator : undefined
              }
              isCompleting={isActive && isLoggingSet}
              isUpcoming={!isActive}
            />
          );
        })}

        {Array.from({ length: extraSetCount }, (_, i) => {
          const setNum = completedSets.length + incompleteSets.length + i + 1;
          // Extra sets are only active once all template pending sets are done
          const isActive = incompleteSets.length === 0 && i === 0;
          return (
            <SetRow
              key={`extra-${i}`}
              setNumber={setNum}
              set={null}
              trackingType={exercise.trackingType}
              suggestedWeight={suggestedWeight}
              suggestedReps={suggestedReps}
              onComplete={handleLogExtraSet}
              onRemove={i === extraSetCount - 1 ? handleRemoveExtraSet : undefined}
              onOpenCalculator={
                exercise.trackingType === 'reps' ? onOpenCalculator : undefined
              }
              isCompleting={isActive && isLoggingSet}
              isUpcoming={!isActive}
            />
          );
        })}

        <TouchableOpacity
          style={styles.addSetBtn}
          onPress={() => setExtraSetCount((c) => c + 1)}
        >
          <Text style={styles.addSetText}>+ Add Set</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: colors.error,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  exerciseName: {
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.1,
  },
  muscleTag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  volumeSummary: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  suggestionBadge: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  suggestionIncrease: {
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1,
    borderColor: `${colors.primary}35`,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  progressDotsRow: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.outlineVariant,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
    paddingTop: 2,
  },
  setHeaderNum: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
    flexShrink: 0,
  },
  setHeaderLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  setHeaderDone: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
    flexShrink: 0,
  },
  addSetBtn: {
    marginTop: spacing.xs,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}0D`,
    borderWidth: 1,
    borderColor: `${colors.primary}28`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  moveControls: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
  },
  moveBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 18,
  },
});
