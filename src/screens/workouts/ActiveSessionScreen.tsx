import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import SessionTimer from '../../components/session/SessionTimer';
import ExerciseCard from '../../components/session/ExerciseCard';
import Button from '../../components/common/Button';
import LeaveWorkoutDialog from '../../components/sheets/LeaveWorkoutDialog';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { WorkoutsScreenProps } from '../../navigation/types';
import type { LogSetData } from '../../components/session/SetRow';
import type { PostSessionItem } from '../../store/uiStore';
import { useFocusEffect } from '@react-navigation/native';
import { log } from '../../utils/logger';

function getLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

export default function ActiveSessionScreen({
  navigation,
}: WorkoutsScreenProps<'ActiveSession'>) {
  const {
    activeSession,
    isFinishing,
    fetchActiveSession,
    logSet,
    removeExercise,
    removePendingSet,
    finishSession,
    pauseSession,
    discardSession,
  } = useSessionStore();
  const { openOverlay, setPostSessionData, setPostSessionQueue, advancePostSessionQueue } =
    useUIStore();
  const user = useAuthStore(s => s.user);

  const prevStatusRef = useRef<string | null>(null);

  const [leaveDialogVisible, setLeaveDialogVisible] = useState(false);
  const [finishDialogVisible, setFinishDialogVisible] = useState(false);

  const elapsed = useSessionTimer(
    activeSession?.durationSeconds ?? 0,
    activeSession?.status === 'active',
  );

  useEffect(() => {
    if (!activeSession) {
      fetchActiveSession();
    }
  }, []);

  // Navigate to hub when session transitions to paused
  useEffect(() => {
    const status = activeSession?.status ?? null;
    if (prevStatusRef.current === 'active' && status === 'paused') {
      navigation.navigate('WorkoutHub');
    }
    prevStatusRef.current = status;
  }, [activeSession?.status]);

  // Block Android hardware back — show leave dialog instead
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setLeaveDialogVisible(true);
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  const handlePauseFromDialog = useCallback(async () => {
    setLeaveDialogVisible(false);
    try {
      await pauseSession();
      // status-change effect handles navigation
    } catch (err) {
      log.error('ActiveSession', 'pause failed:', err);
      // Navigate away anyway so the user isn't trapped
      navigation.navigate('WorkoutHub');
    }
  }, [pauseSession, navigation]);

  const handleDiscardFromDialog = useCallback(async () => {
    setLeaveDialogVisible(false);
    try {
      await discardSession();
    } catch (err) {
      log.error('ActiveSession', 'discard failed:', err);
    } finally {
      // Always navigate — don't leave user stranded if the API fails
      navigation.navigate('WorkoutHub');
    }
  }, [discardSession, navigation]);

  const handleLogSet = useCallback(
    async (exerciseIndex: number, data: LogSetData) => {
      try {
        await logSet(exerciseIndex, data);
        const restSeconds =
          activeSession?.exercises[exerciseIndex]?.restSeconds ?? 90;
        openOverlay('restTimer', { restSeconds });
      } catch (err) {
        log.error('ActiveSession', 'logSet failed:', err);
        Alert.alert('Error', 'Failed to log set. Please try again.');
      }
    },
    [logSet, openOverlay, activeSession],
  );

  const handleOpenCalculator = useCallback(
    (weight: number) => {
      openOverlay('plateCalculator', { currentWeight: weight });
    },
    [openOverlay],
  );

  const handleRemoveExercise = useCallback(
    (exerciseIndex: number) => {
      removeExercise(exerciseIndex).catch(err => {
        log.error('ActiveSession', 'removeExercise failed:', err);
        Alert.alert('Error', 'Could not remove exercise. Please try again.');
      });
    },
    [removeExercise],
  );

  const handleAddExercise = useCallback(() => {
    openOverlay('exercisePicker', { context: 'session' });
  }, [openOverlay]);

  const handleFinish = useCallback(() => {
    if (!activeSession) return;
    if (!activeSession.exercises.length) {
      Alert.alert('Empty Workout', 'Add at least one exercise before finishing.');
      return;
    }
    setFinishDialogVisible(true);
  }, [activeSession]);

  const handleFinishConfirm = useCallback(async () => {
    setFinishDialogVisible(false);

    // Snapshot before the async finish call clears activeSession
    const session = activeSession;
    if (!session?.id) {
      log.error('ActiveSession', 'handleFinishConfirm: activeSession or id is missing', session);
      Alert.alert('Error', 'Session data is missing. Please restart the app.');
      return;
    }

    const sessionId = session.id;
    const exerciseNames: Record<string, string> = {};
    session.exercises.forEach(ex => {
      exerciseNames[ex.exerciseId] = ex.name ?? '';
    });
    const oldLevel = user ? getLevel(user.totalXP) : 1;

    try {
      const result = await finishSession();
      if (!result) {
        log.error('ActiveSession', 'finishSession returned null', null);
        return;
      }

      const newLevel = getLevel(result.xp?.total ?? 0);
      const leveledUp = newLevel > oldLevel;

      const queue: PostSessionItem[] = [];
      if ((result.personalRecords?.length ?? 0) > 0) queue.push('prCelebration');
      if (leveledUp) queue.push('xpLevelUp');
      queue.push('sessionSummary');

      setPostSessionData({
        finishResult: result,
        oldLevel,
        newLevel,
        leveledUp,
        exerciseNames,
        sessionId,
      });
      setPostSessionQueue(queue);
      advancePostSessionQueue();
      navigation.navigate('WorkoutHub');
    } catch (err) {
      log.error('ActiveSession', 'finishSession failed:', err);
      Alert.alert('Error', 'Failed to finish session. Please try again.');
    }
  }, [
    activeSession,
    user,
    finishSession,
    setPostSessionData,
    setPostSessionQueue,
    advancePostSessionQueue,
  ]);

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading session…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={() => setLeaveDialogVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.leaveBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.sessionName} numberOfLines={1}>
            {activeSession.name}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                activeSession.status === 'paused' && styles.statusDotPaused,
              ]}
            />
            <Text style={styles.statusText}>
              {activeSession.status === 'paused' ? 'PAUSED' : 'ACTIVE'}
            </Text>
            <Text style={styles.exerciseCount}>
              {activeSession.exercises.length > 0
                ? ` · ${activeSession.exercises.length} exercise${activeSession.exercises.length !== 1 ? 's' : ''}`
                : ''}
            </Text>
          </View>
        </View>
        <SessionTimer elapsedSeconds={elapsed} />
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => openOverlay('sessionAction')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.menuIcon}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeSession.exercises.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No exercises yet</Text>
            <Text style={styles.emptySub}>Tap "+ Add Exercise" to get started</Text>
          </View>
        )}

        {activeSession.exercises.map((exercise, idx) => (
          <ExerciseCard
            key={`${exercise.exerciseId}-${idx}`}
            exercise={exercise}
            exerciseIndex={idx}
            onLogSet={handleLogSet}
            onOpenCalculator={handleOpenCalculator}
            onRemove={handleRemoveExercise}
            onRemovePendingSet={(setNumber) => removePendingSet(idx, setNumber)}
          />
        ))}

        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={handleAddExercise}
          activeOpacity={0.8}
        >
          <Text style={styles.addExerciseIcon}>+</Text>
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          label={isFinishing ? 'Saving…' : 'Finish Workout'}
          onPress={handleFinish}
          loading={isFinishing}
          disabled={isFinishing}
        />
      </View>

      {/* Leave dialog */}
      <LeaveWorkoutDialog
        visible={leaveDialogVisible}
        onStay={() => setLeaveDialogVisible(false)}
        onPause={handlePauseFromDialog}
        onDiscard={handleDiscardFromDialog}
      />

      {/* Finish confirmation */}
      <Modal
        visible={finishDialogVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFinishDialogVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Finish Workout?</Text>
            <Text style={styles.confirmBody}>
              Great session! Your progress will be saved.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setFinishDialogVisible(false)}
                disabled={isFinishing}
                activeOpacity={0.75}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmFinishBtn}
                onPress={handleFinishConfirm}
                disabled={isFinishing}
                activeOpacity={0.85}
              >
                {isFinishing ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={styles.confirmFinishText}>Finish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusDotPaused: {
    backgroundColor: colors.warning,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  exerciseCount: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
  },
  leaveBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  leaveBtnText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  menuBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  menuIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '700',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.xs,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Add exercise
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  addExerciseIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
  addExerciseText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },

  // Finish confirm
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
  confirmFinishBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmFinishText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});
