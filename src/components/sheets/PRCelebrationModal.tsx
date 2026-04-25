import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useUIStore } from '../../store/uiStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

function prTypeLabel(type: string): string {
  switch (type) {
    case 'weight': return 'Max Weight';
    case '1rm': return 'Estimated 1RM';
    case 'volume': return 'Total Volume';
    case 'distance': return 'Max Distance';
    case 'time': return 'Best Time';
    default: return 'Personal Record';
  }
}

function prValueLabel(type: string, value: number): string {
  switch (type) {
    case 'weight': return `${value} kg`;
    case '1rm': return `${value.toFixed(1)} kg`;
    case 'volume': return `${value} kg`;
    case 'distance': return `${value} m`;
    case 'time': return `${value}s`;
    default: return `${value}`;
  }
}

export default function PRCelebrationModal() {
  const { activeOverlay, postSessionData, advancePostSessionQueue } = useUIStore();
  const isVisible = activeOverlay === 'prCelebration';

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 250 });
    }
  }, [isVisible]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isVisible || !postSessionData) return null;

  const { personalRecords } = postSessionData.finishResult;
  const { exerciseNames } = postSessionData;
  const prCount = personalRecords.length;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.container, contentStyle]}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.tag}>PERSONAL RECORD{prCount !== 1 ? 'S' : ''}</Text>
          <Text style={styles.sub}>
            You crushed {prCount} PR{prCount !== 1 ? 's' : ''} this session!
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {personalRecords.map((pr, i) => (
              <View key={i} style={styles.prRow}>
                <View style={styles.prLeft}>
                  <Text style={styles.prExercise} numberOfLines={1}>
                    {exerciseNames[pr.exercise] ?? 'Exercise'}
                  </Text>
                  <Text style={styles.prType}>{prTypeLabel(pr.type)}</Text>
                </View>
                <Text style={styles.prValue}>{prValueLabel(pr.type, pr.value)}</Text>
              </View>
            ))}
          </ScrollView>

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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
    gap: spacing.md,
    maxHeight: '80%',
  },
  trophy: {
    fontSize: 56,
    lineHeight: 64,
  },
  tag: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.xp,
    letterSpacing: 2,
  },
  sub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    width: '100%',
    flexGrow: 0,
    maxHeight: 260,
  },
  listContent: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  prLeft: {
    flex: 1,
    gap: 2,
  },
  prExercise: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  prType: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  prValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});
