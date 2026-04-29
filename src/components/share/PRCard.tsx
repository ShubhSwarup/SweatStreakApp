import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { radii } from '../../constants/spacing';

export interface PRCardProps {
  exercise: string;
  prType: 'weight' | '1rm' | 'volume' | 'distance' | 'time';
  newValue: number;
  newReps?: number;
  oldValue?: number;
  volume: number;
  sets: number;
  duration: number;
  streak: number;
  intensity: boolean;
  date: string;
  showBranding?: boolean;
}

export const CARD_W = 320;
export const CARD_H = Math.round((CARD_W * 16) / 9);

function formatHeroStat(prType: PRCardProps['prType'], newValue: number, newReps?: number): string {
  switch (prType) {
    case 'weight':
    case '1rm':
      return newReps != null ? `${newValue}KG × ${newReps}` : `${newValue} KG`;
    case 'volume':
      return newValue >= 1000 ? `${(newValue / 1000).toFixed(1)}T` : `${Math.round(newValue)} KG`;
    case 'distance':
      return `${newValue} KM`;
    case 'time':
      return `${newValue}S`;
    default:
      return `${newValue}`;
  }
}

function prTypeLabel(prType: PRCardProps['prType']): string {
  switch (prType) {
    case 'weight':
      return 'WEIGHT PR';
    case '1rm':
      return '1RM PR';
    case 'volume':
      return 'VOLUME PR';
    case 'distance':
      return 'DISTANCE PR';
    case 'time':
      return 'TIME PR';
    default:
      return 'PR';
  }
}

export default function PRCard({
  exercise,
  prType,
  newValue,
  newReps,
  oldValue,
  volume,
  sets,
  duration,
  streak,
  intensity,
  date,
  showBranding = true,
}: PRCardProps) {
  const improvement = oldValue != null ? +(newValue - oldValue).toFixed(1) : null;
  const heroText = formatHeroStat(prType, newValue, newReps);
  const unitLabel = prTypeLabel(prType);

  const heroPulse = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  React.useEffect(() => {
    heroPulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glowPulse, heroPulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + glowPulse.value * 0.1,
  }));

  const heroPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + heroPulse.value * 0.35,
  }));

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.glowTopRight, glowStyle]}>
        <LinearGradient
          colors={[`${colors.primary}32`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.glowBottomLeft, glowStyle]}>
        <LinearGradient
          colors={['transparent', `${colors.secondary}18`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={[styles.topRow, !showBranding && styles.topRowNoBrand]}>
        {showBranding ? (
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandName}>SWEATSTREAK</Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={styles.dateText}>{date}</Text>
      </View>

      <View style={styles.labelBlock}>
        {intensity && (
          <View style={styles.intensityPill}>
            <Text style={styles.intensityText}>HIGH INTENSITY</Text>
          </View>
        )}
        <Text style={styles.prLabel}>{unitLabel}</Text>
        <Text style={styles.exerciseName}>{exercise}</Text>
      </View>

      <View style={styles.heroBlock}>
        <View style={styles.heroGlow}>
          <LinearGradient
            colors={[`${colors.primary}18`, 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Animated.View style={[StyleSheet.absoluteFill, heroPulseStyle]}>
            <LinearGradient
              colors={[`${colors.secondary}20`, `${colors.primary}08`, 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            />
          </Animated.View>
        </View>
        <Text style={styles.heroStat}>{heroText}</Text>
      </View>

      <View style={styles.progressBlock}>
        {oldValue != null && (
          <View style={styles.progressRow}>
            <Text style={styles.progressOld}>{oldValue}</Text>
            <Text style={styles.progressArrow}>  →  </Text>
            <Text style={styles.progressNew}>{newValue}</Text>
          </View>
        )}
        {improvement != null && improvement > 0 && (
          <View style={styles.improvementPill}>
            <Text style={styles.improvementText}>+{improvement} FROM LAST SESSION</Text>
          </View>
        )}
      </View>

      <View style={styles.statsBar}>
        <StatCol
          label="VOLUME"
          value={volume >= 1000 ? `${(volume / 1000).toFixed(1)}T` : `${Math.round(volume)}KG`}
        />
        <View style={styles.statDivider} />
        <StatCol label="SETS" value={String(sets)} />
        <View style={styles.statDivider} />
        <StatCol label="TIME" value={`${duration}M`} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {streak} DAY STREAK</Text>
        </View>
      </View>
    </View>
  );
}

function StatCol({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRowNoBrand: {
    justifyContent: 'flex-end',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  brandName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.8,
  },
  dateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  labelBlock: {
    gap: 6,
  },
  intensityPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.tertiary}18`,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 2,
  },
  intensityText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 10,
    color: colors.tertiary,
    letterSpacing: 1,
  },
  prLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 2.5,
  },
  exerciseName: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    color: colors.text,
    letterSpacing: 0.3,
  },
  heroBlock: {
    position: 'relative',
    paddingVertical: 8,
  },
  heroGlow: {
    position: 'absolute',
    top: -10,
    left: -28,
    width: CARD_W,
    height: 140,
  },
  heroStat: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 72,
    color: colors.primary,
    lineHeight: 80,
    letterSpacing: -2,
  },
  progressBlock: {
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressOld: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textSecondary,
  },
  progressArrow: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textMuted,
  },
  progressNew: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  improvementPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}18`,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  improvementText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.outlineVariant,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  bottomRow: {
    alignItems: 'flex-end',
  },
  streakPill: {
    backgroundColor: `${colors.streak}18`,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  streakText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.streak,
    letterSpacing: 0.5,
  },
});
