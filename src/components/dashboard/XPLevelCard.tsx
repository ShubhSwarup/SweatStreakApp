import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import ProgressBar from '../common/ProgressBar';
import { xpToLevel, xpProgressToNextLevel } from '../../utils/xp';

interface Props {
  totalXP: number;
  onPress: () => void;
}

export default function XPLevelCard({ totalXP, onPress }: Props) {
  const level = xpToLevel(totalXP);
  const { current, needed, percent } = xpProgressToNextLevel(totalXP);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelLabel}>LVL</Text>
          <Text style={styles.levelNum}>{level}</Text>
        </View>
        <View style={styles.right}>
          <View style={styles.topRow}>
            <Text style={styles.xpLabel}>EXPERIENCE</Text>
            <Text style={styles.xpValue}>{totalXP.toLocaleString()} XP</Text>
          </View>
          <ProgressBar progress={percent} height={6} fillColor={colors.primary} />
          <Text style={styles.nextLevel}>
            {current.toLocaleString()} / {needed.toLocaleString()} XP · Level {level + 1}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  levelBadge: {
    width: 68,
    height: 68,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.xp,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  levelNum: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.xp,
    lineHeight: 34,
  },
  right: {
    flex: 1,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  xpValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  nextLevel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
