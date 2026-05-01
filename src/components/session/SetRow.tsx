import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
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
  onComplete: (data: LogSetData) => Promise<void>;
  onRemove?: () => void;
  onUnlog?: () => void;
  onOpenCalculator?: (weight: number) => void;
  isCompleting?: boolean;
  isUpcoming?: boolean;
}

type LayoutMetrics = {
  inputHeight: number;
  stepperWidth: number;
  checkSize: number;
  setNumWidth: number;
  removeSize: number;
  rowGap: number;
  inputFontSize: number;
  completedFontSize: number;
  completedLineHeight: number;
  labelFontSize: number;
};

function getLayoutMetrics(screenWidth: number): LayoutMetrics {
  if (screenWidth <= 350) {
    return {
      inputHeight: 40,
      stepperWidth: 24,
      checkSize: 34,
      setNumWidth: 18,
      removeSize: 22,
      rowGap: 4,
      inputFontSize: 14,
      completedFontSize: 14,
      completedLineHeight: 20,
      labelFontSize: 11,
    };
  }

  if (screenWidth <= 390) {
    return {
      inputHeight: 42,
      stepperWidth: 24,
      checkSize: 38,
      setNumWidth: 20,
      removeSize: 22,
      rowGap: 6,
      inputFontSize: 15,
      completedFontSize: 15,
      completedLineHeight: 21,
      labelFontSize: 12,
    };
  }

  return {
    inputHeight: 46,
    stepperWidth: 28,
    checkSize: 42,
    setNumWidth: 22,
    removeSize: 24,
    rowGap: spacing.sm,
    inputFontSize: 16,
    completedFontSize: 16,
    completedLineHeight: 22,
    labelFontSize: 12,
  };
}

function Stepper({
  label,
  onPress,
  width,
  height,
}: {
  label: string;
  onPress: () => void;
  width: number;
  height: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.stepper, { width, height }]}
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
  onUnlog,
  onOpenCalculator,
  isCompleting = false,
  isUpcoming = false,
}: Props) {
  const { width } = useWindowDimensions();
  const metrics = getLayoutMetrics(width);
  const isCompleted = set?.completed === true;

  const [weight, setWeight] = useState(set?.weight != null ? String(set.weight) : '');
  const [reps, setReps] = useState(set?.reps != null ? String(set.reps) : '');
  const [durationSec, setDurSec] = useState(
    set?.durationSeconds != null ? String(set.durationSeconds) : '',
  );
  const [distance, setDist] = useState(set?.distance != null ? String(set.distance) : '');
  const [error, setError] = useState<string | null>(null);

  const checkScale = useRef(new Animated.Value(1)).current;
  const rowOpacity = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isCompleted) {
      if (weight === '' && suggestedWeight != null) setWeight(String(suggestedWeight));
      if (reps === '' && suggestedReps != null) setReps(String(suggestedReps));
    }
  }, []);

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

  const handleComplete = async () => {
    if (isCompleted || isCompleting || isUpcoming) return;
    const data = validate();
    if (!data) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 1.2,
        useNativeDriver: true,
        speed: 40,
        bounciness: 8,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }),
    ]).start();
    try {
      await onComplete(data);
    } catch {
      setError('Could not save set. Try again.');
    }
  };

  if (isCompleted && set) {
    return (
      <Animated.View
        style={[
          styles.completedRow,
          { opacity: rowOpacity, minHeight: metrics.inputHeight, gap: metrics.rowGap },
        ]}
      >
        <Text style={[styles.setNum, { width: metrics.setNumWidth }]}>{setNumber}</Text>
        <View style={styles.completedBody}>
          {trackingType === 'reps' && (
            <Text
              style={[
                styles.completedText,
                {
                  fontSize: metrics.completedFontSize,
                  lineHeight: metrics.completedLineHeight,
                },
              ]}
              numberOfLines={2}
            >
              {set.weight != null ? `${set.weight} kg` : 'BW'}
              {' × '}
              {set.reps != null ? `${set.reps}` : '—'}
              <Text style={[styles.completedUnit, { fontSize: metrics.labelFontSize }]}> reps</Text>
              {set.isPR && <Text style={styles.prBadge}>  PR 🏆</Text>}
            </Text>
          )}
          {trackingType === 'time' && (
            <Text
              style={[
                styles.completedText,
                {
                  fontSize: metrics.completedFontSize,
                  lineHeight: metrics.completedLineHeight,
                },
              ]}
            >
              {set.durationSeconds != null ? `${set.durationSeconds} s` : '—'}
            </Text>
          )}
          {trackingType === 'distance' && (
            <Text
              style={[
                styles.completedText,
                {
                  fontSize: metrics.completedFontSize,
                  lineHeight: metrics.completedLineHeight,
                },
              ]}
            >
              {set.distance != null ? `${set.distance} km` : '—'}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.checkDone,
            {
              width: metrics.checkSize,
              height: metrics.checkSize,
            },
          ]}
        >
          <Text style={styles.checkDoneIcon}>✓</Text>
        </View>
        {onUnlog && (
          <TouchableOpacity
            style={[
              styles.unlogBtn,
              {
                width: metrics.removeSize,
                height: metrics.removeSize,
                borderRadius: metrics.removeSize / 2,
              },
            ]}
            onPress={onUnlog}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.unlogBtnIcon}>↩</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  return (
    <View>
      <View style={[styles.inputRow, { gap: metrics.rowGap }]}>
        <Text style={[styles.setNum, { width: metrics.setNumWidth }]}>{setNumber}</Text>

        {trackingType === 'reps' && (
          <>
            <View style={[styles.pill, error && styles.pillError, { height: metrics.inputHeight }]}>
              <Stepper
                label="−"
                onPress={() => handleStep('weight', -2.5)}
                width={metrics.stepperWidth}
                height={metrics.inputHeight}
              />
              <TextInput
                style={[
                  styles.pillInput,
                  styles.numericInput,
                  {
                    height: metrics.inputHeight,
                    fontSize: metrics.inputFontSize,
                  },
                  onOpenCalculator && styles.pillInputWithAccessory,
                ]}
                value={weight}
                onChangeText={(v) => {
                  setWeight(v);
                  setError(null);
                }}
                placeholder={suggestedWeight != null ? String(suggestedWeight) : '—'}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                selectTextOnFocus
                underlineColorAndroid="transparent"
              />
              <Stepper
                label="+"
                onPress={() => handleStep('weight', 2.5)}
                width={metrics.stepperWidth}
                height={metrics.inputHeight}
              />
              {onOpenCalculator && (
                <TouchableOpacity
                  style={[
                    styles.calcOverlay,
                    { top: 4, right: metrics.stepperWidth + 3 },
                  ]}
                  onPress={() => onOpenCalculator(parseFloat(weight) || 0)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.calcIcon}>⊞</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.pill, error && styles.pillError, { height: metrics.inputHeight }]}>
              <Stepper
                label="−"
                onPress={() => handleStep('reps', -1)}
                width={metrics.stepperWidth}
                height={metrics.inputHeight}
              />
              <TextInput
                style={[
                  styles.pillInput,
                  styles.numericInput,
                  {
                    height: metrics.inputHeight,
                    fontSize: metrics.inputFontSize,
                  },
                ]}
                value={reps}
                onChangeText={(v) => {
                  setReps(v);
                  setError(null);
                }}
                placeholder={suggestedReps != null ? String(suggestedReps) : '—'}
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                selectTextOnFocus
                underlineColorAndroid="transparent"
              />
              <Stepper
                label="+"
                onPress={() => handleStep('reps', 1)}
                width={metrics.stepperWidth}
                height={metrics.inputHeight}
              />
            </View>
          </>
        )}

        {trackingType === 'time' && (
          <View
            style={[
              styles.pill,
              styles.pillFull,
              error && styles.pillError,
              { height: metrics.inputHeight },
            ]}
          >
            <TextInput
              style={[
                styles.pillInput,
                styles.pillInputFull,
                styles.numericInput,
                {
                  height: metrics.inputHeight,
                  fontSize: metrics.inputFontSize,
                },
              ]}
              value={durationSec}
              onChangeText={(v) => {
                setDurSec(v);
                setError(null);
              }}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              selectTextOnFocus
              underlineColorAndroid="transparent"
            />
            <Text style={styles.pillUnit}>sec</Text>
          </View>
        )}

        {trackingType === 'distance' && (
          <View
            style={[
              styles.pill,
              styles.pillFull,
              error && styles.pillError,
              { height: metrics.inputHeight },
            ]}
          >
            <TextInput
              style={[
                styles.pillInput,
                styles.pillInputFull,
                styles.numericInput,
                {
                  height: metrics.inputHeight,
                  fontSize: metrics.inputFontSize,
                },
              ]}
              value={distance}
              onChangeText={(v) => {
                setDist(v);
                setError(null);
              }}
              placeholder="0.0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              selectTextOnFocus
              underlineColorAndroid="transparent"
            />
            <Text style={styles.pillUnit}>km</Text>
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <TouchableOpacity
            style={[
              styles.checkBtn,
              (isCompleting || isUpcoming) && styles.checkBtnDisabled,
              isUpcoming && styles.checkBtnUpcoming,
              {
                width: metrics.checkSize,
                height: metrics.checkSize,
              },
            ]}
            onPress={handleComplete}
            disabled={isCompleting || isUpcoming}
            activeOpacity={0.75}
          >
            <Text style={styles.checkBtnIcon}>{isCompleting ? '…' : '✓'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {onRemove && (
          <TouchableOpacity
            style={[
              styles.removeBtn,
              {
                width: metrics.removeSize,
                height: metrics.removeSize,
                borderRadius: metrics.removeSize / 2,
              },
            ]}
            onPress={onRemove}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.removeBtnIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={[
            styles.errorText,
            { marginLeft: metrics.setNumWidth + metrics.rowGap },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  setNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
    flexShrink: 0,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  completedBody: {
    flex: 1,
    minWidth: 0,
  },
  completedText: {
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  completedUnit: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  prBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  checkDone: {
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1.5,
    borderColor: `${colors.primary}55`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkDoneIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  pill: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
  },
  pillFull: {
    flex: 2,
  },
  pillError: {
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  stepper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepperText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '300',
    color: colors.textSecondary,
  },
  pillInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
    fontWeight: '700',
  },
  numericInput: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pillInputWithAccessory: {
    paddingRight: 14,
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
  calcOverlay: {
    position: 'absolute',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcIcon: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 14,
  },
  checkBtn: {
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  checkBtnDisabled: {
    opacity: 0.45,
  },
  checkBtnUpcoming: {
    opacity: 0.25,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkBtnIcon: {
    fontSize: 18,
    color: colors.onPrimary,
    fontWeight: '800',
  },
  removeBtn: {
    backgroundColor: `${colors.error}18`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  removeBtnIcon: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 11,
    color: colors.error,
    marginTop: 3,
    marginBottom: 4,
  },
  unlogBtn: {
    backgroundColor: `${colors.outlineVariant}40`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unlogBtnIcon: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
