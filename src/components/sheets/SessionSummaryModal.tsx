import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { useUIStore } from '../../store/uiStore';
import { navigationRef } from '../../utils/navigation';
import { useSessionStore } from '../../store/sessionStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import SharePreviewScreen from '../share/SharePreviewScreen';
import type { ShareData, ShareTemplate } from '../share/shareTypes';
import { selectBestTemplate } from '../../utils/selectBestTemplate';

function formatDuration(seconds: number): string {
  const t = Math.floor(seconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  return `${s}s`;
}

function levelLabel(level: number): string {
  if (level >= 30) return 'ELITE';
  if (level >= 20) return 'ADVANCED';
  if (level >= 10) return 'INTERMEDIATE';
  return 'BEGINNER';
}

function formatShareDate(now = new Date()): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function getIntensityLevel(summary: { totalVolume: number; totalSets: number }): 'low' | 'medium' | 'high' {
  if (summary.totalSets > 20 || summary.totalVolume > 5000) return 'high';
  if (summary.totalSets > 12 || summary.totalVolume > 2500) return 'medium';
  return 'low';
}

function inferMuscleGroup(sessionName: string): string {
  const name = sessionName.toLowerCase();
  if (name.includes('push') || name.includes('chest')) return 'CHEST';
  if (name.includes('pull') || name.includes('back')) return 'BACK';
  if (name.includes('leg') || name.includes('quad') || name.includes('ham')) return 'LEGS';
  if (name.includes('shoulder')) return 'SHOULDERS';
  if (name.includes('arm') || name.includes('bicep') || name.includes('tricep')) return 'ARMS';
  if (name.includes('core') || name.includes('abs')) return 'CORE';
  if (name.includes('cardio') || name.includes('run')) return 'CARDIO';
  return 'FULL BODY';
}

export default function SessionSummaryModal() {
  const [shareVisible, setShareVisible] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  const { activeOverlay, postSessionData, advancePostSessionQueue, clearPostSessionData } =
    useUIStore();
  const { clearFinishResult } = useSessionStore();
  const isVisible = activeOverlay === 'sessionSummary';

  useEffect(() => {
    if (!postSessionData?.sessionId) return;
    setHasShared(false);
    setShareVisible(false);
  }, [postSessionData?.sessionId]);

  if (!isVisible || !postSessionData) return null;

  const { finishResult, sessionId, exerciseNames, newLevel, sessionName } = postSessionData;
  const { summary, xp, streak, personalRecords, message } = finishResult;

  const hasPRs = personalRecords.length > 0;
  const intensityLevel = getIntensityLevel(summary);
  const isHighIntensity = intensityLevel === 'high';
  const firstPR =
    personalRecords.find((pr) => pr.type === 'weight' || pr.type === '1rm') ?? personalRecords[0];
  const workoutName = sessionName?.trim() ? sessionName.toUpperCase() : 'WORKOUT';
  const muscleGroup = inferMuscleGroup(sessionName ?? '');

  const defaultTemplate: ShareTemplate = selectBestTemplate({
    hasPR: hasPRs,
    intensity: intensityLevel,
    volume: summary.totalVolume,
    muscleGroup,
  });

  const shareData: ShareData = {
    volume: summary.totalVolume,
    sets: summary.totalSets,
    duration: Math.round(summary.duration / 60),
    streak: streak.current,
    intensity: isHighIntensity,
    date: formatShareDate(),
    level: levelLabel(newLevel),
    prExercise: firstPR ? exerciseNames[firstPR.exercise] ?? firstPR.exercise : workoutName,
    prType: firstPR?.type ?? 'weight',
    prNewValue: firstPR?.value ?? 0,
    workoutName,
    muscleGroup,
  };

  const dismiss = () => {
    advancePostSessionQueue();
    clearFinishResult();
    clearPostSessionData();
  };

  const handleDone = () => {
    dismiss();
    navigationRef.navigate('Main', { screen: 'DashboardTab', params: { screen: 'Dashboard' } });
  };

  const handleViewDetails = () => {
    dismiss();
    // Seed ProgressHub into the stack first so back returns to it
    navigationRef.navigate('Main', {
      screen: 'ProgressTab',
      params: { screen: 'ProgressHub' },
    });
    navigationRef.navigate('Main', {
      screen: 'ProgressTab',
      params: { screen: 'PastSessionDetail', params: { sessionId } },
    });
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={styles.sheet} entering={SlideInUp.duration(380).springify()}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.tag}>WORKOUT COMPLETE</Text>
            <Text style={styles.heading}>Great session! 💪</Text>
            {message && message !== '💪 Solid workout!' && (
              <Text style={styles.message}>{message}</Text>
            )}

            <View style={styles.statsGrid}>
              <StatCard
                label="VOLUME"
                value={
                  summary.totalVolume >= 1000
                    ? `${(summary.totalVolume / 1000).toFixed(1)}t`
                    : `${Math.round(summary.totalVolume)}kg`
                }
              />
              <StatCard label="SETS" value={String(summary.totalSets)} />
              <StatCard label="EXERCISES" value={String(summary.totalExercises)} />
              <StatCard label="DURATION" value={formatDuration(summary.duration)} />
            </View>

            <View style={styles.rewardRow}>
              <View style={[styles.rewardCard, styles.xpCard]}>
                <Text style={styles.xpValue}>+{xp.earned}</Text>
                <Text style={styles.rewardLabel}>XP EARNED</Text>
              </View>
              <View style={[styles.rewardCard, styles.streakCard]}>
                <Text style={styles.streakValue}>{streak.current}</Text>
                <Text style={styles.rewardLabel}>DAY STREAK</Text>
              </View>
            </View>

            {personalRecords.length > 0 && (
              <View style={styles.prBadge}>
                <Text style={styles.prBadgeText}>
                  🏆 {personalRecords.length} Personal Record
                  {personalRecords.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleViewDetails}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleDone} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.shareBtn, hasShared && styles.shareBtnSecondary]}
              onPress={() => setShareVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={[styles.shareBtnText, hasShared && styles.shareBtnTextSecondary]}>
                {hasShared ? 'Share Again' : 'Share Workout Card'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      <SharePreviewScreen
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        onShareSuccess={() => setHasShared(true)}
        shareData={shareData}
        defaultTemplate={defaultTemplate}
      />
    </Modal>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing['4xl'],
    maxHeight: '85%',
  },
  content: {
    padding: spacing['2xl'],
    gap: spacing.xl,
  },
  tag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rewardCard: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  xpCard: {
    backgroundColor: `${colors.xp}18`,
  },
  streakCard: {
    backgroundColor: `${colors.streak}18`,
  },
  xpValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.xp,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.streak,
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  prBadge: {
    backgroundColor: `${colors.xp}18`,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  prBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.xp,
  },
  footer: {
    flexDirection: 'column',
    gap: spacing.sm,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  shareBtn: {
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnSecondary: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  shareBtnTextSecondary: {
    color: colors.textSecondary,
  },
});
