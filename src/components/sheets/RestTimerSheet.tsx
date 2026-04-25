import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useUIStore } from '../../store/uiStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RestTimerSheet() {
  const { activeOverlay, overlayData, closeOverlay, restTimerDefault } = useUIStore();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['35%'], []);

  const restSeconds = (overlayData.restSeconds as number | undefined) ?? restTimerDefault;
  const [remaining, setRemaining] = useState(restSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isVisible = activeOverlay === 'restTimer';

  // Reset when sheet opens
  useEffect(() => {
    if (isVisible) {
      setRemaining(restSeconds);
      setIsRunning(true);
    }
  }, [isVisible, restSeconds]);

  // Countdown tick
  useEffect(() => {
    if (!isRunning || !isVisible) return;
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setIsRunning(false);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, isVisible]);

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Pulse animation on completion
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 180, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  if (!isVisible) return null;

  const progress = 1 - remaining / restSeconds;
  const isDone = remaining === 0;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={closeOverlay}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>REST TIMER</Text>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={[styles.countdown, isDone && styles.countdownDone]}>
            {isDone ? 'GO!' : formatCountdown(remaining)}
          </Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress * 100, 100)}%` as any },
              isDone && styles.progressDone,
            ]}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={closeOverlay}
          >
            <Text style={styles.skipText}>Skip Rest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setRemaining(r => r + 30)}
          >
            <Text style={styles.addText}>+30s</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  handle: {
    backgroundColor: colors.outlineVariant,
    width: 36,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  countdown: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  countdownDone: {
    color: colors.primary,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressDone: {
    backgroundColor: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  skipBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHighest,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}22`,
  },
  addText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
