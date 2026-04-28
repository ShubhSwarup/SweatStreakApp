import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
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

// ── Layout constants ──────────────────────────────────────────────────────────
// Card has 20px padding each side → 335px on a 375px phone.
// Row: setNum(28) + gap(8) + pill(flex) + gap(8) + pill(flex) + gap(8) + check(52) = 104px fixed
// Each pill: (335−104)/2 ≈ 115px → stepper(32)+input(~51px)+stepper(32)
// With remove button: (335−104−8−28)/2 ≈ 97px → stepper(32)+input(~33px)+stepper(32)
const INPUT_H   = 52;   // pill + completed row height
const STEPPER_W = 32;   // wide enough to tap easily, leaves ~51px for input text
const CHECK_SZ  = 52;   // log-set CTA — must stand out
const SET_NUM_W = 28;   // # column

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.stepper}
      activeOpacity={0.5}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Text style={styles.stepperText}>{label}</Text>
    </TouchableOpacity>
  );
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

  const [weight, setWeight]       = useState(set?.weight       != null ? String(set.weight)       : '');
  const [reps,   setReps]         = useState(set?.reps         != null ? String(set.reps)         : '');
  const [durationSec, setDurSec]  = useState(set?.durationSeconds != null ? String(set.durationSeconds) : '');
  const [distance,    setDist]    = useState(set?.distance      != null ? String(set.distance)     : '');
  const [error,  setError]        = useState<string | null>(null);

  const checkScale = useRef(new Animated.Value(1)).current;
  const rowOpacity = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;

  // Pre-fill from suggestion once on mount
  useEffect(() => {
    if (!isCompleted) {
      if (weight === '' && suggestedWeight != null) setWeight(String(suggestedWeight));
      if (reps   === '' && suggestedReps   != null) setReps(String(suggestedReps));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade in completed row
  useEffect(() => {
    if (isCompleted) {
      Animated.timing(rowOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [isCompleted, rowOpacity]);

  const handleStep = (field: 'weight' | 'reps', step: number) => {
    Haptics.selectionAsync();
    if (field === 'weight') {
      const v = parseFloat(weight) || 0;
      setWeight(String(Math.max(0.5, +(v + step).toFixed(2))));
    } else {
      const v = parseInt(reps, 10) || 0;
      setReps(String(Math.max(1, v + step)));
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
      const wVal = w ? parseFloat(w) : undefined;
      if (w && (isNaN(wVal!) || wVal! <= 0)) {
        setError('Enter a valid weight');
        return null;
      }
      return { reps: parseInt(r, 10), ...(wVal && wVal > 0 ? { weight: wVal } : {}) };
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
    if (!data) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1.2, useNativeDriver: true, speed: 40, bounciness: 8 }),
      Animated.spring(checkScale, { toValue: 1,   useNativeDriver: true, speed: 40, bounciness: 0 }),
    ]).start();
    onComplete(data);
  };

  // ── Completed row ─────────────────────────────────────────────────────────
  if (isCompleted && set) {
    return (
      <Animated.View style={[styles.completedRow, { opacity: rowOpacity }]}>
        <Text style={styles.setNum}>{setNumber}</Text>
        <View style={styles.completedBody}>
          {trackingType === 'reps' && (
            <Text style={styles.completedText}>
              {set.weight != null ? `${set.weight} kg` : 'BW'}
              {'  ×  '}
              {set.reps != null ? `${set.reps}` : '—'}
              <Text style={styles.completedUnit}> reps</Text>
              {set.isPR && <Text style={styles.prBadge}>  PR 🏆</Text>}
            </Text>
          )}
          {trackingType === 'time' && (
            <Text style={styles.completedText}>
              {set.durationSeconds != null ? `${set.durationSeconds} s` : '—'}
            </Text>
          )}
          {trackingType === 'distance' && (
            <Text style={styles.completedText}>
              {set.distance != null ? `${set.distance} km` : '—'}
            </Text>
          )}
        </View>
        <View style={styles.checkDone}>
          <Text style={styles.checkDoneIcon}>✓</Text>
        </View>
      </Animated.View>
    );
  }

  // ── Input row ─────────────────────────────────────────────────────────────
  return (
    <View>
      <View style={styles.inputRow}>
        {/* # */}
        <Text style={styles.setNum}>{setNumber}</Text>

        {/* Reps tracking: two pills side by side */}
        {trackingType === 'reps' && (
          <>
            {/* Weight pill — calc icon overlaid in corner, no layout cost */}
            <View style={[styles.pill, error && styles.pillError]}>
              <Stepper label="−" onPress={() => handleStep('weight', -2.5)} />
              <TextInput
                style={styles.pillInput}
                value={weight}
                onChangeText={v => { setWeight(v); setError(null); }}
                placeholder={suggestedWeight != null ? String(suggestedWeight) : '—'}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                selectTextOnFocus
                underlineColorAndroid="transparent"
              />
              <Stepper label="+" onPress={() => handleStep('weight', 2.5)} />
              {onOpenCalculator && (
                <TouchableOpacity
                  style={styles.calcOverlay}
                  onPress={() => onOpenCalculator(parseFloat(weight) || 0)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.calcIcon}>⊞</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Reps pill */}
            <View style={[styles.pill, error && styles.pillError]}>
              <Stepper label="−" onPress={() => handleStep('reps', -1)} />
              <TextInput
                style={styles.pillInput}
                value={reps}
                onChangeText={v => { setReps(v); setError(null); }}
                placeholder={suggestedReps != null ? String(suggestedReps) : '—'}
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                selectTextOnFocus
                underlineColorAndroid="transparent"
              />
              <Stepper label="+" onPress={() => handleStep('reps', 1)} />
            </View>
          </>
        )}

        {/* Time tracking */}
        {trackingType === 'time' && (
          <View style={[styles.pill, styles.pillFull, error && styles.pillError]}>
            <TextInput
              style={[styles.pillInput, styles.pillInputFull]}
              value={durationSec}
              onChangeText={v => { setDurSec(v); setError(null); }}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              selectTextOnFocus
              underlineColorAndroid="transparent"
            />
            <Text style={styles.pillUnit}>sec</Text>
          </View>
        )}

        {/* Distance tracking */}
        {trackingType === 'distance' && (
          <View style={[styles.pill, styles.pillFull, error && styles.pillError]}>
            <TextInput
              style={[styles.pillInput, styles.pillInputFull]}
              value={distance}
              onChangeText={v => { setDist(v); setError(null); }}
              placeholder="0.0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              selectTextOnFocus
              underlineColorAndroid="transparent"
            />
            <Text style={styles.pillUnit}>km</Text>
          </View>
        )}

        {/* Log Set — hero CTA */}
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <TouchableOpacity
            style={[styles.checkBtn, isCompleting && styles.checkBtnDisabled]}
            onPress={handleComplete}
            disabled={isCompleting}
            activeOpacity={0.75}
          >
            <Text style={styles.checkBtnIcon}>{isCompleting ? '…' : '✓'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Remove set */}
        {onRemove && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={onRemove}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.removeBtnIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Shared ──────────────────────────────────────────────────────────────────
  setNum: {
    width: SET_NUM_W,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ── Completed row ───────────────────────────────────────────────────────────
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: INPUT_H,
    paddingVertical: 6,
    gap: spacing.sm,
  },
  completedBody: {
    flex: 1,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  completedUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  prBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  checkDone: {
    width: CHECK_SZ,
    height: CHECK_SZ,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDoneIcon: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '800',
  },

  // ── Input row ───────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: spacing.sm,
  },

  // Pill = the rounded input group [stepper | textInput | stepper]
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: INPUT_H,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    // position:relative is the RN default — needed for calcOverlay
  },
  pillFull: {
    flex: 2,           // time / distance gets more room
  },
  pillError: {
    borderWidth: 1.5,
    borderColor: colors.error,
  },

  // Stepper — fills the full pill height so the whole side column is tappable
  stepper: {
    width: STEPPER_W,
    height: INPUT_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '300',
    color: colors.textSecondary,
  },

  // Text input inside pill
  pillInput: {
    flex: 1,
    height: INPUT_H,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,          // #FFFFFF — white, always visible
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  pillInputFull: {
    paddingHorizontal: spacing.md,
    textAlign: 'right',
  },
  pillUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    paddingRight: spacing.sm,
  },

  // Plate calculator badge — absolute so it doesn't shrink the input
  calcOverlay: {
    position: 'absolute',
    bottom: 3,
    right: STEPPER_W + 2,   // sits just inside the right stepper
    width: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcIcon: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 15,
  },

  // Log Set CTA
  checkBtn: {
    width: CHECK_SZ,
    height: CHECK_SZ,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDisabled: {
    opacity: 0.45,
  },
  checkBtnIcon: {
    fontSize: 24,
    color: colors.onPrimary,
    fontWeight: '800',
  },

  // Remove set (secondary — kept small intentionally)
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: `${colors.error}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnIcon: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '700',
  },

  // Error
  errorText: {
    fontSize: 11,
    color: colors.error,
    marginLeft: SET_NUM_W + spacing.sm,
    marginTop: 3,
    marginBottom: 4,
  },
});
