import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore } from '../../store/sessionStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTemplateStore } from '../../store/templateStore';
import { usePlanStore } from '../../store/planStore';
import { useProgressStore } from '../../store/progressStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { ProfileScreenProps } from '../../navigation/types';

const REST_TIMER_OPTIONS = [
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
];

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function RowLabel({ label, sub }: { label: string; sub?: string }) {
  return (
    <View style={styles.rowLabelBox}>
      <Text style={styles.rowLabel}>{label}</Text>
      {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
    </View>
  );
}

export default function SettingsScreen({ navigation }: ProfileScreenProps<'Settings'>) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const weightUnit = useUIStore(state => state.weightUnit);
  const restTimerDefault = useUIStore(state => state.restTimerDefault);
  const notificationsEnabled = useUIStore(state => state.notificationsEnabled);
  const setWeightUnit = useUIStore(state => state.setWeightUnit);
  const setRestTimerDefault = useUIStore(state => state.setRestTimerDefault);
  const setNotificationsEnabled = useUIStore(state => state.setNotificationsEnabled);
  const resetUI = useUIStore(state => state.reset);

  const resetSession = useSessionStore(state => state.reset);
  const resetDashboard = useDashboardStore(state => state.reset);
  const resetExercise = useExerciseStore(state => state.reset);
  const resetTemplate = useTemplateStore(state => state.reset);
  const resetPlan = usePlanStore(state => state.reset);
  const resetProgress = useProgressStore(state => state.reset);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              // Clear all data stores before logging out
              resetSession();
              resetDashboard();
              resetExercise();
              resetTemplate();
              resetPlan();
              resetProgress();
              resetUI();
              await logout();
            } catch {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  }, [logout, resetSession, resetDashboard, resetExercise, resetTemplate, resetPlan, resetProgress, resetUI]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This feature is coming soon. Contact support to delete your account.',
      [{ text: 'OK' }],
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Preferences */}
        <SectionHeader title="PREFERENCES" />
        <View style={styles.section}>
          {/* Weight unit */}
          <View style={styles.row}>
            <RowLabel label="Weight Unit" sub="Used throughout the app" />
            <View style={styles.segmentedControl}>
              {(['kg', 'lbs'] as const).map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.segmentBtn, weightUnit === unit && styles.segmentBtnActive]}
                  onPress={() => setWeightUnit(unit)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.segmentBtnText, weightUnit === unit && styles.segmentBtnTextActive]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Notifications */}
          <View style={styles.row}>
            <RowLabel label="Notifications" sub="Workout reminders & milestones" />
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.outlineVariant, true: `${colors.primary}66` }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {/* Rest Timer */}
        <SectionHeader title="REST TIMER" />
        <View style={styles.section}>
          <View style={styles.row}>
            <RowLabel label="Default Duration" sub="Auto-set when a set is completed" />
          </View>
          <View style={styles.timerOptions}>
            {REST_TIMER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.timerBtn, restTimerDefault === opt.value && styles.timerBtnActive]}
                onPress={() => setRestTimerDefault(opt.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.timerBtnText, restTimerDefault === opt.value && styles.timerBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Name</Text>
            <Text style={styles.accountValue}>{user?.name ?? '—'}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue}>{user?.email ?? '—'}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Member Since</Text>
            <Text style={styles.accountValue}>{memberSince}</Text>
          </View>
        </View>

        {/* Actions */}
        <SectionHeader title="SESSION" />
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
            disabled={isLoggingOut}
            activeOpacity={0.75}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Text style={styles.actionLogout}>Log Out</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.75}
          >
            <Text style={styles.actionDelete}>Delete Account</Text>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>SweatStreak · Built with Expo SDK 54</Text>
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
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    minWidth: 60,
  },

  // Content
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.sm,
  },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  section: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
  },

  // Generic row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  rowLabelBox: {
    flex: 1,
    gap: 3,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainerHighest,
  },

  // Segmented control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md - 3,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentBtnTextActive: {
    color: colors.onPrimary,
  },

  // Rest timer
  timerOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  timerBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
  },
  timerBtnActive: {
    backgroundColor: `${colors.primary}22`,
  },
  timerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  timerBtnTextActive: {
    color: colors.primary,
  },

  // Account rows
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  accountLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  actionLogout: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  actionDelete: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  comingSoonPill: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  // Version
  versionText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
