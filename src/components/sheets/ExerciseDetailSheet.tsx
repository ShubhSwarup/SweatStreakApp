import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useUIStore } from '../../store/uiStore';
import { navigationRef } from '../../utils/navigation';
import { useExerciseStore } from '../../store/exerciseStore';
import { useSessionStore } from '../../store/sessionStore';
import { getExerciseLastPerformance } from '../../api/progression';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import Badge from '../common/Badge';
import type { Exercise, ExerciseLastPerformance } from '../../types/api';

function StatBox({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

export default function ExerciseDetailSheet() {
  const { activeOverlay, overlayData, openOverlay, closeOverlay } = useUIStore();
  const { fetchExerciseById } = useExerciseStore();
  const { activeSession, addExercise } = useSessionStore();

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%', '90%'], []);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [stats, setStats] = useState<ExerciseLastPerformance | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const isVisible = activeOverlay === 'exerciseDetail';
  const exerciseId = overlayData.exerciseId as string | undefined;
  const fromPicker = overlayData.fromPicker as boolean | undefined;
  const context = overlayData.context as string | undefined;

  useEffect(() => {
    if (!isVisible || !exerciseId) {
      setExercise(null);
      setStats(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchExerciseById(exerciseId),
      getExerciseLastPerformance(exerciseId),
    ])
      .then(([ex, statsRes]) => {
        if (cancelled) return;
        setExercise(ex);
        setStats(statsRes.data ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isVisible, exerciseId]);

  const handleClose = useCallback(() => closeOverlay(), [closeOverlay]);

  const handleBackToPicker = useCallback(() => {
    openOverlay('exercisePicker', { context });
  }, [openOverlay, context]);

  const handleAddToSession = useCallback(async () => {
    if (!exercise || !activeSession) return;
    setAdding(true);
    await addExercise(exercise._id);
    setAdding(false);
    closeOverlay();
  }, [exercise, activeSession, addExercise, closeOverlay]);

  const { setSelectedExercise } = useExerciseStore();
  const handleAddToTemplate = useCallback(() => {
    if (!exercise) return;
    setSelectedExercise(exercise);
    closeOverlay();
  }, [exercise, setSelectedExercise, closeOverlay]);

  const handleViewProgress = useCallback(() => {
    if (!exercise) return;
    closeOverlay();
    navigationRef.navigate('Main', {
      screen: 'ProgressTab',
      params: { screen: 'ExerciseProgressDetail', params: { exerciseId: exercise._id } },
    });
  }, [exercise, closeOverlay]);

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {fromPicker && (
            <TouchableOpacity onPress={handleBackToPicker} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={closeOverlay}
            style={styles.closeBtnWrap}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : !exercise ? (
          <View style={styles.loaderContainer}>
            <Text style={styles.errorText}>Exercise not found</Text>
          </View>
        ) : (
          <>
            {/* Exercise name + type */}
            <View style={styles.section}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={exercise.exerciseType}
                  variant={exercise.exerciseType === 'cardio' ? 'tertiary' : 'primary'}
                />
                <Badge label={exercise.trackingType} variant="default" />
                <Badge label={exercise.type} variant="default" />
                <Badge label={exercise.difficulty} variant="default" />
              </View>
            </View>

            {/* Muscles */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PRIMARY MUSCLES</Text>
              <View style={styles.badgeRow}>
                {exercise.primaryMuscles.map(m => (
                  <Badge key={m} label={m} variant="muscle" />
                ))}
              </View>

              {exercise.secondaryMuscles.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>SECONDARY</Text>
                  <View style={styles.badgeRow}>
                    {exercise.secondaryMuscles.map(m => (
                      <Badge key={m} label={m} variant="muscle" />
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Equipment */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>EQUIPMENT</Text>
              <Text style={styles.bodyText}>{exercise.equipment}</Text>
            </View>

            {/* Description */}
            {exercise.description && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>DESCRIPTION</Text>
                <Text style={styles.bodyText}>{exercise.description}</Text>
              </View>
            )}

            {/* User stats */}
            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>YOUR STATS</Text>
              {stats ? (
                <View style={styles.statsGrid}>
                  <StatBox
                    label="Last Weight"
                    value={String(stats.lastWeight)}
                    unit="kg"
                  />
                  <StatBox
                    label="Last Reps"
                    value={String(stats.lastReps)}
                    unit="reps"
                  />
                  <StatBox
                    label="Best Weight"
                    value={String(stats.bestWeight)}
                    unit="kg"
                  />
                  <StatBox
                    label="Est. 1RM"
                    value={stats.estimated1RM.toFixed(1)}
                    unit="kg"
                  />
                </View>
              ) : (
                <View style={styles.noStatsContainer}>
                  <Text style={styles.noStatsText}>No history yet — log your first set!</Text>
                </View>
              )}
            </View>

            {/* CTAs */}
            <View style={styles.ctaStack}>
              {activeSession && context === 'session' && (
                <TouchableOpacity
                  style={[styles.primaryCta, adding && styles.ctaDisabled]}
                  onPress={handleAddToSession}
                  disabled={adding}
                  activeOpacity={0.85}
                >
                  {adding ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={styles.primaryCtaText}>Add to Session</Text>
                  )}
                </TouchableOpacity>
              )}
              {context === 'template' && (
                <TouchableOpacity
                  style={styles.primaryCta}
                  onPress={handleAddToTemplate}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryCtaText}>Add to Template</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.secondaryCta}
                onPress={handleViewProgress}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryCtaText}>View Progress</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </BottomSheetScrollView>
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backBtn: {
    flex: 1,
  },
  backBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  closeBtnWrap: {
    alignSelf: 'flex-end',
  },
  closeBtn: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Loader / Error
  loaderContainer: {
    paddingVertical: spacing['4xl'] * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Exercise title
  exerciseName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  // Stats
  statsSection: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statsSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '40%',
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noStatsContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  noStatsText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // CTAs
  ctaStack: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryCta: {
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  secondaryCta: {
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
