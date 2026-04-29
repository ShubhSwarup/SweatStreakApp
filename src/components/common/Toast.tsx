import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: 'info' | 'success' | 'error';
}

const toneMap = {
  info: {
    backgroundColor: colors.surfaceContainerHighest,
    borderColor: `${colors.primary}30`,
    textColor: colors.text,
  },
  success: {
    backgroundColor: `${colors.primary}18`,
    borderColor: `${colors.primary}40`,
    textColor: colors.primary,
  },
  error: {
    backgroundColor: `${colors.error}18`,
    borderColor: `${colors.error}40`,
    textColor: colors.error,
  },
} as const;

export default function Toast({ visible, message, variant = 'info' }: ToastProps) {
  if (!visible || !message) return null;

  const tone = toneMap[variant];

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(160)}
      pointerEvents="none"
      style={styles.wrapper}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: tone.backgroundColor,
            borderColor: tone.borderColor,
          },
        ]}
      >
        <Text style={[styles.text, { color: tone.textColor }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    zIndex: 50,
  },
  toast: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
});
