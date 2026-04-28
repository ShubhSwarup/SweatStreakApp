import React from 'react';
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

function formatDuration(seconds: number): string {
  const t = Math.floor(seconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  return `${s}s`;
}

export default function SessionSummaryModal() {
  const { activeOverlay, postSessionData, advancePostSessionQueue, clearPostSessionData } =
    useUIStore();
  const { clearFinishResult } = useSessionStore();
  const isVisible = activeOverlay === 'sessionSummary';

  if (!isVisible || !postSessionData) return null;

  const { finishResult, sessionId } = postSessionData;
  const { summary, xp, streak, personalRecords, message } = finishResult;

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
            {/* Header */}
            <Text style={styles.tag}>WORKOUT COMPLETE</Text>
            <Text style={styles.heading}>Great session! 💪</Text>
            {message && message !== '💪 Solid workout!' && (
              <Text style={styles.message}>{message}</Text>
            )}

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <StatCard
                label="VOLUME"
                value={`${summary.totalVolume >= 1000
                  ? `${(summary.totalVolume / 1000).toFixed(1)}t`
                  : `${Math.round(summary.totalVolume)}kg`}`}
              />
              <StatCard label="SETS" value={String(summary.totalSets)} />
              <StatCard label="EXERCISES" value={String(summary.totalExercises)} />
              <StatCard label="DURATION" value={formatDuration(summary.duration)} />
            </View>

            {/* XP + Streak row */}
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

            {/* PR badge */}
            {personalRecords.length > 0 && (
              <View style={styles.prBadge}>
                <Text style={styles.prBadgeText}>
                  🏆 {personalRecords.length} Personal Record
                  {personalRecords.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer CTAs */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleViewDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleDone}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
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

  // Header
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

  // Stats grid
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

  // Reward row
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

  // PR badge
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

  // Footer
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
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
});
