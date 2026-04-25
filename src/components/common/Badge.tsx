import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

type Variant = 'default' | 'primary' | 'pr' | 'muscle' | 'tertiary';

interface BadgeProps {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
}

export default function Badge({ label, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={textStyles[variant]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  primary: {
    backgroundColor: colors.primary + '26',
  },
  pr: {
    backgroundColor: colors.xp + '26',
  },
  muscle: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  tertiary: {
    backgroundColor: colors.tertiary + '20',
  },
});

const textStyles = StyleSheet.create({
  default: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  primary: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  pr: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.xp,
    letterSpacing: 0.8,
  },
  muscle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  tertiary: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.tertiary,
    letterSpacing: 0.8,
  },
});
