import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing['2xl'],
  },
});
