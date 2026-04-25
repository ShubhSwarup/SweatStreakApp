import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

const LABELS: Record<string, string> = {
  weight: 'WEIGHT PR',
  '1rm': '1RM PR',
  volume: 'VOL PR',
  distance: 'DIST PR',
  time: 'TIME PR',
};

interface Props {
  type: string;
  compact?: boolean;
}

export default function PRBadge({ type, compact = false }: Props) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text style={[styles.text, compact && styles.textCompact]}>
        {LABELS[type] ?? 'PR'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeCompact: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  textCompact: {
    fontSize: 9,
  },
});
