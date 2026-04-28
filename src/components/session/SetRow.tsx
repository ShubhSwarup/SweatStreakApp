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
  onRemove?: () => void;
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
  onRemove,
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
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from suggestion once on mount
  useEffect(() => {
    if (!isCompleted) {
      if (weight === '' && suggestedWeight != null) setWeight(String(suggestedWeight));
      if (reps === '' && suggestedReps != null) setReps(String(suggestedReps));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStep = (field: 'weight' | 'reps', step: number) => {
    if (field === 'weight') {
      const current = parseFloat(weight) || 0;
      setWeight(Math.max(0.5, current + step).toString());
    } else {
      const current = parseInt(reps, 10) || 0;
      setReps(Math.max(1, current + step).toString());
    }
    setError(null);
  };

  const validate = (): LogSetData | null => {
    setError(null);
    if (trackingType === 'reps') {
      const r = reps.trim();
      if (!r || isNaN(parseInt(r, 10)) || parseInt(r, 10) <= 0) {
        setError('Enter reps to log this set');
        return null;
      }
      const w = weight.trim();
      const weightVal = w ? parseFloat(w) : undefined;
      if (w && (isNaN(weightVal!) || weightVal! <= 0)) {
        setError('Enter a valid weight');
        return null;
      }
      return {
        reps: parseInt(r, 10),
        ...(weightVal !== undefined && weightVal > 0 ? { weight: weightVal } : {}),
      };
    }
    if (trackingType === 'time') {
      const d = durationSec.trim();
      if (!d || isNaN(parseInt(d, 10)) || parseInt(d, 10) <= 0) {
        setError('Enter duration in seconds');
        return null;
      }
      return { durationSeconds: parseInt(d, 10) };
    }
    if (trackingType === 'distance') {
      const dist = distance.trim();
      if (!dist || isNaN(parseFloat(dist)) || parseFloat(dist) <= 0) {
        setError('Enter distance in km');
        return null;
      }
      return { distance: parseFloat(dist) };
    }
    return {};
  };

  const handleComplete = () => {
    if (isCompleted || isCompleting) return;
    const data = validate();
    if (!data) return;
    onComplete(data);
  };

  // ── Completed row (read-only) ─────────────────────────────────────────────
  if (isCompleted && set) {
    return (
      <View style={styles.completedRow}>
        <Text style={styles.setNumCompleted}>{setNumber}</Text>
        <View style={styles.completedValues}>
          {trackingType === 'reps' && (
            <Text style={styles.completedText}>
              {set.weight != null ? `${set.weight} kg` : 'BW'}
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

  // ── Input row ─────────────────────────────────────────────────────────────
  return (
    <View>
      <View style={styles.inputRow}>
          <Text style={styles.setNum}>{setNumber}</Text>

        {trackingType === 'reps' && (
          <>
            <View style={[styles.inputGroup, error && styles.inputError]}>
              <TouchableOpacity onPress={() => handleStep('weight', -2.5)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={styles.stepperIcon}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { textAlign: 'center' }]}
                value={weight}
                onChangeText={v => { setWeight(v); setError(null); }}
                placeholder={suggestedWeight != null ? String(suggestedWeight) : '0'}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <TouchableOpacity onPress={() => handleStep('weight', 2.5)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={styles.stepperIcon}>+</Text>
              </TouchableOpacity>
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
            <View style={[styles.inputGroup, error && styles.inputError]}>
              <TouchableOpacity onPress={() => handleStep('reps', -1)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={styles.stepperIcon}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { textAlign: 'center' }]}
                value={reps}
                onChangeText={v => { setReps(v); setError(null); }}
                placeholder={suggestedReps != null ? String(suggestedReps) : 'reps'}
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <TouchableOpacity onPress={() => handleStep('reps', 1)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={styles.stepperIcon}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {trackingType === 'time' && (
          <TextInput
            style={[styles.input, styles.fullInput, error && styles.inputError]}
            value={durationSec}
            onChangeText={v => { setDurationSec(v); setError(null); }}
            placeholder="seconds"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            selectTextOnFocus
          />
        )}

        {trackingType === 'distance' && (
          <TextInput
            style={[styles.input, styles.fullInput, error && styles.inputError]}
            value={distance}
            onChangeText={v => { setDistance(v); setError(null); }}
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

        {onRemove && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeBtnIcon}>−</Text>
          </TouchableOpacity>
        )}
      </View>

      {error != null && (
        <Text style={styles.errorText}>{error}</Text>
      )}
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
  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${colors.error}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnIcon: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '700',
    lineHeight: 18,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.error,
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
  stepperIcon: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingHorizontal: 4,
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
  errorText: {
    fontSize: 11,
    color: colors.error,
    marginLeft: 30,
    marginTop: 2,
    marginBottom: 2,
  },
});
