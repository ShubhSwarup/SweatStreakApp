import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { formatDuration } from '../../utils/time';

interface LastWorkout {
  name: string;
  date: string;
  duration: number;
  volume: number;
}

interface Props {
  lastWorkout: LastWorkout;
  onPress: () => void;
}

function relativeDate(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`;
  return `${vol} kg`;
}

export default function PreviousSessionCard({ lastWorkout, onPress }: Props) {
  const { name, date, duration, volume } = lastWorkout;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.tag}>PREVIOUS SESSION</Text>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{relativeDate(date)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{formatDuration(duration)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{formatVolume(volume)}</Text>
        </View>
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
    padding: spacing.xl,
    gap: spacing.md,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dot: {
    fontSize: 13,
    color: colors.textMuted,
  },
  arrow: {
    fontSize: 26,
    color: colors.textMuted,
    fontWeight: '300',
  },
});
