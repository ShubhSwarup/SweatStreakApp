import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import SetRow, { type LogSetData } from './SetRow';
import type { SessionExercise } from '../../types/api';

interface Props {
  exercise: SessionExercise;
  exerciseIndex: number;
  onLogSet: (exerciseIndex: number, data: LogSetData) => Promise<void>;
  onOpenCalculator: (weight: number) => void;
  onRemove: (exerciseIndex: number) => void;
}

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  onLogSet,
  onOpenCalculator,
  onRemove,
}: Props) {
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
          Animated.spring(translateX, {
            toValue: -72,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const closeSwipe = () =>
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();

  const handleRemove = () => {
    closeSwipe();
    Alert.alert(
      'Remove Exercise',
      `Remove "${exercise.name}" from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(exerciseIndex),
        },
      ],
    );
  };

  const handleLogSet = async (data: LogSetData) => {
    setIsLoggingSet(true);
    try {
      await onLogSet(exerciseIndex, data);
    } finally {
      setIsLoggingSet(false);
    }
  };

  const completedSets = exercise.sets.filter(s => s.completed);
  const incompleteSets = exercise.sets.filter(s => !s.completed);
  const suggestedWeight = exercise.suggestion?.weight ?? exercise.lastPerformance?.weight ?? null;
  const suggestedReps = exercise.suggestion?.reps ?? exercise.lastPerformance?.reps ?? null;

  const totalSetCount = exercise.sets.length + extraSetCount;

  return (
    <View style={styles.swipeContainer}>
      {/* Delete button revealed on swipe */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleRemove}>
        <Text style={styles.deleteBtnText}>Remove</Text>
      </TouchableOpacity>

      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Exercise header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.muscleTag}>
              {exercise.trackingType.toUpperCase()}
              {exercise.lastPerformance && (
                <>
                  {'  ·  LAST: '}
                  {exercise.lastPerformance.weight}kg × {exercise.lastPerformance.reps}
                </>
              )}
            </Text>
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
        </View>

        {/* Set headers */}
        <View style={styles.setHeaderRow}>
          <Text style={styles.setHeaderNum}>#</Text>
          {exercise.trackingType === 'reps' && (
            <>
              <Text style={styles.setHeaderLabel}>WEIGHT</Text>
              <Text style={styles.setHeaderLabel}>REPS</Text>
            </>
          )}
          {exercise.trackingType === 'time' && (
            <Text style={styles.setHeaderLabel}>DURATION (sec)</Text>
          )}
          {exercise.trackingType === 'distance' && (
            <Text style={styles.setHeaderLabel}>DISTANCE (km)</Text>
          )}
          <Text style={[styles.setHeaderLabel, { width: 40, textAlign: 'center' }]}>
            DONE
          </Text>
        </View>

        {/* Completed sets */}
        {completedSets.map(s => (
          <SetRow
            key={`done-${s.setNumber}`}
            setNumber={s.setNumber}
            set={s}
            trackingType={exercise.trackingType}
            onComplete={handleLogSet}
          />
        ))}

        {/* Incomplete (pre-populated) sets */}
        {incompleteSets.map(s => (
          <SetRow
            key={`pending-${s.setNumber}`}
            setNumber={s.setNumber}
            set={s}
            trackingType={exercise.trackingType}
            suggestedWeight={suggestedWeight}
            suggestedReps={suggestedReps}
            onComplete={handleLogSet}
            onOpenCalculator={exercise.trackingType === 'reps' ? onOpenCalculator : undefined}
            isCompleting={isLoggingSet}
          />
        ))}

        {/* User-added extra sets */}
        {Array.from({ length: extraSetCount }, (_, i) => (
          <SetRow
            key={`extra-${i}`}
            setNumber={completedSets.length + incompleteSets.length + i + 1}
            set={null}
            trackingType={exercise.trackingType}
            suggestedWeight={suggestedWeight}
            suggestedReps={suggestedReps}
            onComplete={handleLogSet}
            onOpenCalculator={exercise.trackingType === 'reps' ? onOpenCalculator : undefined}
            isCompleting={isLoggingSet}
          />
        ))}

        {/* Add set button */}
        <TouchableOpacity
          style={styles.addSetBtn}
          onPress={() => setExtraSetCount(c => c + 1)}
        >
          <Text style={styles.addSetText}>+ Set</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 72,
    backgroundColor: colors.error,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    gap: 3,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  muscleTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  suggestionBadge: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suggestionIncrease: {
    backgroundColor: `${colors.primary}22`,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  // Set headers
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: 4,
  },
  setHeaderNum: {
    width: 22,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  setHeaderLabel: {
    flex: 1,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  // Add set
  addSetBtn: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
