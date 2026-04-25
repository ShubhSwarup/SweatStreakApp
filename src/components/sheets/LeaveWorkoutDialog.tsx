import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

interface Props {
  visible: boolean;
  onStay: () => void;
  onPause: () => void;
  onDiscard: () => void;
}

export default function LeaveWorkoutDialog({ visible, onStay, onPause, onDiscard }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Leave Workout?</Text>
          <Text style={styles.body}>
            Pause to save progress, or discard to exit.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.discardBtn} onPress={onDiscard} activeOpacity={0.8}>
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pauseBtn} onPress={onPause} activeOpacity={0.85}>
              <Text style={styles.pauseText}>Pause</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.stayBtn} onPress={onStay} activeOpacity={0.75}>
            <Text style={styles.stayText}>Stay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  discardBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pauseBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  stayBtn: {
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
