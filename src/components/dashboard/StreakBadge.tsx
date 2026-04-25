import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

interface Props {
  current: number;
  onPress: () => void;
}

export default function StreakBadge({ current, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.container}>
      <Text style={styles.icon}>🔥</Text>
      <View style={styles.textBlock}>
        <Text style={styles.count}>{current}</Text>
        <Text style={styles.label}>DAY STREAK</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  icon: {
    fontSize: 30,
  },
  textBlock: {
    flex: 1,
  },
  count: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.streak,
    lineHeight: 36,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  arrow: {
    fontSize: 26,
    color: colors.textMuted,
    fontWeight: '300',
  },
});
