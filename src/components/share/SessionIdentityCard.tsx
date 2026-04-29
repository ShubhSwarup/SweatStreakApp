import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { radii } from '../../constants/spacing';
import { CARD_W, CARD_H } from './PRCard';

export interface SessionIdentityCardProps {
  workoutName: string;
  volume: number;
  duration: number;
  sets: number;
  muscleGroup: string;
  intensity: boolean;
  streak: number;
  level: string;
  percentile?: number;
  date: string;
  showBranding?: boolean;
}

export default function SessionIdentityCard({
  workoutName,
  volume,
  duration,
  sets,
  muscleGroup,
  intensity,
  streak,
  level,
  percentile,
  date,
  showBranding = true,
}: SessionIdentityCardProps) {
  const volumeLabel = volume >= 1000 ? `${(volume / 1000).toFixed(1)}T` : `${Math.round(volume)} KG`;
  const lineProgress = useSharedValue(0);

  React.useEffect(() => {
    lineProgress.value = 0;
    lineProgress.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [lineProgress]);

  const accentLineStyle = useAnimatedStyle(() => ({
    height: 200 * lineProgress.value,
    opacity: lineProgress.value,
  }));

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[colors.surface, colors.surfaceContainerLow]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <Animated.View style={[styles.accentLine, accentLineStyle]}>
        <LinearGradient
          colors={[colors.primary, colors.tertiary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
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

      <View style={styles.titleBlock}>
        <Text style={styles.workoutTitle}>{workoutName}</Text>
        <View style={styles.destroyedRow}>
          <Text style={styles.destroyedText}>DESTROYED</Text>
        </View>
      </View>

      {intensity && (
        <View style={styles.intensityPill}>
          <Text style={styles.intensityText}>HIGH INTENSITY SESSION</Text>
        </View>
      )}

      <View style={styles.statCardsRow}>
        <GlassStatCard label="VOLUME" value={volumeLabel} />
        <GlassStatCard label="DURATION" value={`${duration} MIN`} />
        <GlassStatCard label="SETS" value={`${sets} SETS`} />
      </View>

      <View style={styles.muscleBlock}>
        <Text style={styles.muscleIcon}>🎯</Text>
        <View>
          <Text style={styles.muscleLabel}>MAIN MUSCLE GROUP</Text>
          <Text style={styles.muscleName}>{muscleGroup}</Text>
        </View>
      </View>

      {percentile != null && (
        <View style={styles.leaderboardCard}>
          <View style={styles.leaderboardLeft}>
            <Text style={styles.leaderboardIcon}>📊</Text>
            <Text style={styles.leaderboardText}>
              YOU OUTLIFTED <Text style={styles.leaderboardPct}>{percentile}%</Text> OF USERS
            </Text>
          </View>
          <View style={styles.percentileBarTrack}>
            <View style={[styles.percentileBarFill, { width: `${percentile}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.badgesRow}>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {streak} DAY STREAK</Text>
        </View>
        <View style={styles.levelPill}>
          <Text style={styles.levelText}>⭐ {level}</Text>
        </View>
      </View>
    </View>
  );
}

function GlassStatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.glassCard}>
      <Text style={styles.glassValue}>{value}</Text>
      <Text style={styles.glassLabel}>{label}</Text>
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
  accentLine: {
    position: 'absolute',
    left: 14,
    top: 80,
    width: 4,
    borderRadius: 2,
    overflow: 'hidden',
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
  titleBlock: {
    gap: 4,
    paddingLeft: 8,
  },
  workoutTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 52,
    color: colors.text,
    lineHeight: 58,
    letterSpacing: -1,
  },
  destroyedRow: {
    transform: [{ rotate: '-3deg' }],
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  destroyedText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 36,
    color: colors.primary,
    letterSpacing: 1,
  },
  intensityPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.tertiary}18`,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  intensityText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.tertiary,
    letterSpacing: 1,
  },
  statCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  glassCard: {
    flex: 1,
    backgroundColor: `${colors.surfaceContainerHigh}CC`,
    borderRadius: radii.sm,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: `${colors.text}0D`,
  },
  glassValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  glassLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  muscleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  muscleIcon: {
    fontSize: 24,
  },
  muscleLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  muscleName: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  leaderboardCard: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: radii.sm,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leaderboardIcon: {
    fontSize: 20,
  },
  leaderboardText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    flex: 1,
  },
  leaderboardPct: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: colors.primary,
    fontSize: 14,
  },
  percentileBarTrack: {
    height: 4,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  percentileBarFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  levelPill: {
    backgroundColor: `${colors.xp}14`,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  levelText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: colors.xp,
    letterSpacing: 0.5,
  },
});
