import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore } from '../../store/sessionStore';
import { navigationRef } from '../../utils/navigation';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

export default function SessionActionSheet() {
  const { activeOverlay, closeOverlay } = useUIStore();
  const { activeSession, pauseSession, discardSession } = useSessionStore();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%'], []);
  const [discardConfirmVisible, setDiscardConfirmVisible] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const isVisible = activeOverlay === 'sessionAction';
  const isPaused = activeSession?.status === 'paused';

  const handlePause = async () => {
    try {
      await pauseSession();
      closeOverlay();
      navigationRef.navigate('Main', { screen: 'WorkoutsTab', params: { screen: 'WorkoutHub' } });
    } catch {
      // error shown by store
    }
  };

  const handleDiscardConfirm = async () => {
    setIsDiscarding(true);
    try {
      await discardSession();
      setDiscardConfirmVisible(false);
      closeOverlay();
      navigationRef.navigate('Main', { screen: 'DashboardTab', params: { screen: 'Dashboard' } });
    } catch {
      setIsDiscarding(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
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
          <Text style={styles.title}>{activeSession?.name ?? 'Workout'}</Text>

          {!isPaused && (
            <TouchableOpacity style={styles.actionBtn} onPress={handlePause}>
              <Text style={styles.actionIcon}>⏸</Text>
              <View style={styles.actionText}>
                <Text style={styles.actionLabel}>Pause Workout</Text>
                <Text style={styles.actionSub}>Resume from any tab</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.destructiveBtn]}
            onPress={() => setDiscardConfirmVisible(true)}
          >
            <Text style={styles.actionIcon}>🗑</Text>
            <View style={styles.actionText}>
              <Text style={[styles.actionLabel, styles.destructiveLabel]}>
                Discard Workout
              </Text>
              <Text style={styles.actionSub}>Not saved to stats</Text>
            </View>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Themed discard confirmation */}
      <Modal visible={discardConfirmVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Discard Workout?</Text>
            <Text style={styles.confirmBody}>
              This workout will not be saved to your stats. Are you sure?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDiscardConfirmVisible(false)}
                disabled={isDiscarding}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelText}>Cancel</Text>
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
  sheetBg: { backgroundColor: colors.surfaceContainerHigh },
  handle: { backgroundColor: colors.outlineVariant, width: 36 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
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
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
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
