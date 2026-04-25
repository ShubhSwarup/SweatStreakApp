import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { SessionSet } from '../../types/api';

export interface LogSetData {
  weight?: number;
  reps?: number;
  durationSeconds?: number;
  distance?: number;
}

interface Props {
  setNumber: number;
  set: SessionSet | null;
  trackingType: 'reps' | 'time' | 'distance';
  suggestedWeight?: number | null;
  suggestedReps?: number | null;
  onComplete: (data: LogSetData) => void;
  onOpenCalculator?: (weight: number) => void;
  isCompleting?: boolean;
}

export default function SetRow({
  setNumber,
  set,
  trackingType,
  suggestedWeight,
  suggestedReps,
  onComplete,
  onOpenCalculator,
  isCompleting = false,
}: Props) {
  const isCompleted = set?.completed === true;

  const [weight, setWeight] = useState(
    set?.weight != null ? String(set.weight) : '',
  );
  const [reps, setReps] = useState(
    set?.reps != null ? String(set.reps) : '',
  );
  const [durationSec, setDurationSec] = useState(
    set?.durationSeconds != null ? String(set.durationSeconds) : '',
  );
  const [distance, setDistance] = useState(
    set?.distance != null ? String(set.distance) : '',
  );

  // Pre-fill from suggestion if empty
  useEffect(() => {
    if (!isCompleted) {
      if (weight === '' && suggestedWeight != null) {
        setWeight(String(suggestedWeight));
      }
      if (reps === '' && suggestedReps != null) {
        setReps(String(suggestedReps));
      }
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = () => {
    if (isCompleted || isCompleting) return;
    const data: LogSetData = {};
    if (trackingType === 'reps') {
      if (weight) data.weight = parseFloat(weight);
      if (reps) data.reps = parseInt(reps, 10);
    } else if (trackingType === 'time') {
      if (durationSec) data.durationSeconds = parseInt(durationSec, 10);
    } else if (trackingType === 'distance') {
      if (distance) data.distance = parseFloat(distance);
    }
    onComplete(data);
  };

  if (isCompleted && set) {
    return (
      <View style={styles.completedRow}>
        <Text style={styles.setNumCompleted}>{setNumber}</Text>
        <View style={styles.completedValues}>
          {trackingType === 'reps' && (
            <Text style={styles.completedText}>
              {set.weight != null ? `${set.weight} kg` : '—'}
              {'  ×  '}
              {set.reps != null ? `${set.reps} reps` : '—'}
              {set.isPR && <Text style={styles.prBadge}> PR</Text>}
            </Text>
          )}
          {trackingType === 'time' && (
            <Text style={styles.completedText}>
              {set.durationSeconds != null ? `${set.durationSeconds}s` : '—'}
            </Text>
          )}
          {trackingType === 'distance' && (
            <Text style={styles.completedText}>
              {set.distance != null ? `${set.distance} km` : '—'}
            </Text>
          )}
        </View>
        <View style={styles.checkDone}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inputRow}>
      <Text style={styles.setNum}>{setNumber}</Text>

      {trackingType === 'reps' && (
        <>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder={suggestedWeight != null ? String(suggestedWeight) : 'kg'}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            {onOpenCalculator && (
              <TouchableOpacity
                style={styles.calcIcon}
                onPress={() => onOpenCalculator(parseFloat(weight) || 0)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.calcIconText}>⊞</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.input, styles.repsInput]}
            value={reps}
            onChangeText={setReps}
            placeholder={suggestedReps != null ? String(suggestedReps) : 'reps'}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            selectTextOnFocus
          />
        </>
      )}

      {trackingType === 'time' && (
        <TextInput
          style={[styles.input, styles.fullInput]}
          value={durationSec}
          onChangeText={setDurationSec}
          placeholder="seconds"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          selectTextOnFocus
        />
      )}

      {trackingType === 'distance' && (
        <TextInput
          style={[styles.input, styles.fullInput]}
          value={distance}
          onChangeText={setDistance}
          placeholder="km"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
      )}

      <TouchableOpacity
        style={[styles.checkBtn, isCompleting && styles.checkBtnDisabled]}
        onPress={handleComplete}
        disabled={isCompleting}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Text style={styles.checkBtnIcon}>{isCompleting ? '…' : '✓'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Completed row
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: spacing.sm,
  },
  setNumCompleted: {
    width: 22,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  completedValues: {
    flex: 1,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  prBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  checkDone: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 14,
    color: colors.onPrimary,
    fontWeight: '700',
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.sm,
  },
  setNum: {
    width: 22,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: spacing.xs,
  },
  repsInput: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  fullInput: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  calcIcon: {
    paddingLeft: 4,
    paddingRight: 6,
  },
  calcIconText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDisabled: {
    opacity: 0.5,
  },
  checkBtnIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
});
