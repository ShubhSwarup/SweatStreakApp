import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore } from '../../store/sessionStore';
import { navigationRef } from '../../utils/navigation';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { log } from '../../utils/logger';

export default function SessionActionSheet() {
  const { activeOverlay, closeOverlay } = useUIStore();
  const { activeSession, pauseSession, discardSession } = useSessionStore();
  const [discardConfirmVisible, setDiscardConfirmVisible] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  const isVisible = activeOverlay === 'sessionAction';
  const isPaused = activeSession?.status === 'paused';

  const handlePause = async () => {
    setIsPausing(true);
    try {
      await pauseSession();
    } catch (err) {
      log.error('SessionActionSheet', 'pauseSession failed:', err);
    } finally {
      setIsPausing(false);
      closeOverlay();
      navigationRef.navigate('Main', {
        screen: 'WorkoutsTab',
        params: { screen: 'WorkoutHub' },
      });
    }
  };

  const handleDiscardConfirm = async () => {
    setIsDiscarding(true);
    try {
      await discardSession();
    } catch (err) {
      log.error('SessionActionSheet', 'discardSession failed:', err);
    } finally {
      setIsDiscarding(false);
      setDiscardConfirmVisible(false);
      closeOverlay();
      navigationRef.navigate('Main', {
        screen: 'WorkoutsTab',
        params: { screen: 'WorkoutHub' },
      });
    }
  };

  return (
    <>
      {/* Action sheet */}
      <Modal
        visible={isVisible && !discardConfirmVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeOverlay}
      >
        <Pressable style={styles.backdrop} onPress={closeOverlay}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.title}>{activeSession?.name ?? 'Workout'}</Text>

            {!isPaused && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handlePause}
                disabled={isPausing}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>⏸</Text>
                <View style={styles.actionText}>
                  <Text style={styles.actionLabel}>
                    {isPausing ? 'Pausing…' : 'Pause Workout'}
                  </Text>
                  <Text style={styles.actionSub}>Resume from any tab</Text>
                </View>
                {isPausing && <ActivityIndicator color={colors.primary} size="small" />}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, styles.destructiveBtn]}
              onPress={() => setDiscardConfirmVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>🗑</Text>
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, styles.destructiveLabel]}>
                  Discard Workout
                </Text>
                <Text style={styles.actionSub}>Not saved to stats</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={closeOverlay}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Discard confirmation */}
      <Modal
        visible={discardConfirmVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDiscardConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Discard Workout?</Text>
            <Text style={styles.confirmBody}>
              This workout will not be saved to your stats. Are you sure?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setDiscardConfirmVisible(false)}
                disabled={isDiscarding}
                activeOpacity={0.75}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDiscardBtn}
                onPress={handleDiscardConfirm}
                disabled={isDiscarding}
                activeOpacity={0.8}
              >
                {isDiscarding ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDiscardText}>Discard</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  destructiveBtn: {
    backgroundColor: `${colors.error}18`,
  },
  actionIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  destructiveLabel: {
    color: colors.error,
  },
  actionSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cancelBtn: {
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Confirm dialog
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  confirmDialog: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  confirmBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmDiscardBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDiscardText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
