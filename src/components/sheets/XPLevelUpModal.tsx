import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useUIStore } from '../../store/uiStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

function getLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

export default function XPLevelUpModal() {
  const { activeOverlay, postSessionData, advancePostSessionQueue } = useUIStore();
  const isVisible = activeOverlay === 'xpLevelUp';

  const containerOpacity = useSharedValue(0);
  const oldScale = useSharedValue(1);
  const oldOpacity = useSharedValue(1);
  const newScale = useSharedValue(0.3);
  const newOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Reset
      oldScale.value = 1;
      oldOpacity.value = 1;
      newScale.value = 0.3;
      newOpacity.value = 0;
      containerOpacity.value = 0;

      // Fade in container
      containerOpacity.value = withTiming(1, { duration: 300 });
      // Old badge fades out after pause
      oldOpacity.value = withDelay(700, withTiming(0, { duration: 250 }));
      oldScale.value = withDelay(700, withTiming(0.5, { duration: 250 }));
      // New badge pops in
      newOpacity.value = withDelay(950, withTiming(1, { duration: 200 }));
      newScale.value = withDelay(950, withSpring(1, { damping: 8, stiffness: 140 }));
    }
  }, [isVisible]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const oldBadgeStyle = useAnimatedStyle(() => ({
    opacity: oldOpacity.value,
    transform: [{ scale: oldScale.value }],
  }));
  const newBadgeStyle = useAnimatedStyle(() => ({
    opacity: newOpacity.value,
    transform: [{ scale: newScale.value }],
  }));

  if (!isVisible || !postSessionData) return null;

  const { oldLevel, newLevel, finishResult } = postSessionData;
  const { xp, summary, streak } = finishResult;

  const baseXP = 10;
  const setXP = summary.totalSets;
  const streakBonus = streak.continued ? 5 : 0;
  const otherBonus = Math.max(0, xp.earned - baseXP - setXP - streakBonus);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.container, containerStyle]}>
          <Text style={styles.tag}>LEVEL UP!</Text>
          <Text style={styles.sub}>You reached a new level!</Text>

          {/* Level transition */}
          <View style={styles.badgesRow}>
            <Animated.View style={[styles.oldBadge, oldBadgeStyle]}>
              <Text style={styles.oldLevel}>{oldLevel}</Text>
              <Text style={styles.oldLevelLabel}>prev</Text>
            </Animated.View>

            <Text style={styles.arrow}>→</Text>

            <Animated.View style={[styles.newBadge, newBadgeStyle]}>
              <Text style={styles.newLevel}>{newLevel}</Text>
              <Text style={styles.newLevelLabel}>level</Text>
            </Animated.View>
          </View>

          {/* XP earned */}
          <View style={styles.xpCard}>
            <View style={styles.xpTotalRow}>
              <Text style={styles.xpTotalLabel}>XP GAINED</Text>
              <Text style={styles.xpTotalValue}>+{xp.earned}</Text>
            </View>
            <View style={styles.divider} />
            <BreakdownRow label="Base workout" xp={baseXP} />
            <BreakdownRow label={`${summary.totalSets} sets`} xp={setXP} />
            {streakBonus > 0 && <BreakdownRow label="Streak bonus" xp={streakBonus} />}
            {otherBonus > 0 && <BreakdownRow label="Bonus" xp={otherBonus} />}
          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={advancePostSessionQueue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function BreakdownRow({ label, xp }: { label: string; xp: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>+{xp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  container: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.lg,
  },
  tag: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.xp,
    letterSpacing: 2.5,
  },
  sub: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  // Level badges
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    height: 100,
  },
  oldBadge: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  oldLevel: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textMuted,
  },
  oldLevelLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  arrow: {
    fontSize: 22,
    color: colors.outlineVariant,
    fontWeight: '700',
  },
  newBadge: {
    width: 100,
    height: 100,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}22`,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  newLevel: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  newLevelLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },

  // XP card
  xpCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  xpTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  xpTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.xp,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.xp,
  },

  // CTA
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});
