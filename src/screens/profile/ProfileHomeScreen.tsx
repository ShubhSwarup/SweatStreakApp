import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import ProgressBar from '../../components/common/ProgressBar';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { ProfileScreenProps } from '../../navigation/types';

function getLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 50;
}

function xpProgress(totalXP: number): { level: number; progress: number; xpInLevel: number; xpNeeded: number } {
  const level = getLevel(totalXP);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const xpInLevel = totalXP - current;
  const xpNeeded = next - current;
  return { level, progress: xpNeeded > 0 ? xpInLevel / xpNeeded : 1, xpInLevel, xpNeeded };
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({
  label,
  icon,
  onPress,
  badge,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
      </View>
      <Text style={styles.menuItemText}>{label}</Text>
      {badge ? (
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{badge}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileHomeScreen({ navigation }: ProfileScreenProps<'ProfileHome'>) {
  const user = useAuthStore(state => state.user);
  const { data: dashData, isLoading, error, fetchDashboard } = useDashboardStore();

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const firstName = user?.name?.split(' ')[0] ?? 'Athlete';
  const initial = firstName.charAt(0).toUpperCase();

  // Prefer live dashboard data, fall back to auth user
  const totalXP = dashData?.xp?.total ?? user?.totalXP ?? 0;
  const currentStreak = dashData?.streak?.current ?? user?.currentStreak ?? 0;
  const longestStreak = dashData?.streak?.longest ?? user?.longestStreak ?? 0;

  const { level, progress, xpInLevel, xpNeeded } = xpProgress(totalXP);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.gearBtn}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchDashboard}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surfaceContainerHigh}
          />
        }
      >
        {/* Inline error banner */}
        {error && !isLoading && (
          <TouchableOpacity style={styles.errorBanner} onPress={fetchDashboard} activeOpacity={0.8}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
            <Text style={styles.errorBannerText}>Couldn't refresh data — tap to retry</Text>
          </TouchableOpacity>
        )}

        {/* Avatar + identity */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.name}>{user?.name ?? 'Athlete'}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
            {memberSince && <Text style={styles.memberSince}>Member since {memberSince}</Text>}
          </View>
        </View>

        {/* XP + Level */}
        <View style={styles.xpCard}>
          <View style={styles.xpTop}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{level}</Text>
            </View>
            <View style={styles.xpInfo}>
              <Text style={styles.levelLabel}>LEVEL {level}</Text>
              <Text style={styles.xpAmount}>{totalXP.toLocaleString()} XP total</Text>
            </View>
            <Text style={styles.xpNextLabel}>
              {xpInLevel} / {xpNeeded} to Lv {level + 1}
            </Text>
          </View>
          <ProgressBar progress={progress} height={8} />
        </View>

        {/* Streak stats */}
        <View style={styles.statsRow}>
          <StatBox label="Current Streak" value={`${currentStreak}d`} color={colors.streak} />
          <View style={styles.statDivider} />
          <StatBox label="Longest Streak" value={`${longestStreak}d`} />
          <View style={styles.statDivider} />
          <StatBox label="Total XP" value={totalXP.toLocaleString()} color={colors.xp} />
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <MenuItem
            label="My Plans"
            icon="calendar-outline"
            onPress={() => navigation.navigate('PlanList')}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            label="AI Suggestions"
            icon="sparkles-outline"
            onPress={() => navigation.navigate('AISuggestions')}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            label="Friends"
            icon="people-outline"
            onPress={() => navigation.navigate('Friends')}
            badge="Soon"
          />
          <View style={styles.menuDivider} />
          <MenuItem
            label="Settings"
            icon="options-outline"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.warning}18`,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
  },

  // Identity card
  identityCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  identityInfo: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  memberSince: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  // XP card
  xpCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  xpTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  levelBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.onPrimary,
  },
  xpInfo: {
    flex: 1,
    gap: 2,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  xpAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  xpNextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Stats
  statsRow: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.outlineVariant,
  },

  // Menu section
  menuSection: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainerHighest,
    marginHorizontal: spacing.xl,
  },
  badgePill: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
