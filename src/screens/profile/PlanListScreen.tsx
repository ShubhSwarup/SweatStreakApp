import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { usePlanStore } from '../../store/planStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import Badge from '../../components/common/Badge';
import type { WorkoutPlan } from '../../types/api';
import type { ProfileScreenProps } from '../../navigation/types';

function PlanCard({
  plan,
  onPress,
  onActivate,
  onDuplicate,
  onDelete,
  isSaving,
}: {
  plan: WorkoutPlan;
  onPress: () => void;
  onActivate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const workoutDays = plan.days.filter(d => d.type === 'workout').length;
  const restDays = plan.days.filter(d => d.type === 'rest').length;
  const createdAt = new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName} numberOfLines={1}>{plan.name}</Text>
          {plan.isActive && <Badge label="Active" variant="primary" />}
        </View>
        <Text style={styles.cardMeta}>
          {plan.days.length} days · {workoutDays} workout{workoutDays !== 1 ? 's' : ''} · {restDays} rest
        </Text>
        <Text style={styles.cardDate}>Created {createdAt}</Text>
      </View>

      <View style={styles.cardActions}>
        {!plan.isActive && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnActivate]}
            onPress={onActivate}
            disabled={isSaving}
          >
            <Text style={styles.actionBtnTextActivate}>Activate</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onDuplicate}
          disabled={isSaving}
        >
          <Text style={styles.actionBtnText}>Duplicate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDelete]}
          onPress={onDelete}
          disabled={isSaving}
        >
          <Text style={styles.actionBtnTextDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function PlanListScreen({ navigation }: ProfileScreenProps<'PlanList'>) {
  const { plans, isLoading, isSaving, error, fetchPlans, activatePlan, duplicatePlan, deletePlan, clearError } = usePlanStore();

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [fetchPlans]),
  );

  // Surface store errors as alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleActivate = useCallback((plan: WorkoutPlan) => {
    Alert.alert(
      'Activate Plan',
      `Set "${plan.name}" as your active training plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', onPress: () => activatePlan(plan._id) },
      ],
    );
  }, [activatePlan]);

  const handleDuplicate = useCallback((plan: WorkoutPlan) => {
    Alert.alert(
      'Duplicate Plan',
      `Create a copy of "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Duplicate', onPress: () => duplicatePlan(plan._id) },
      ],
    );
  }, [duplicatePlan]);

  const handleDelete = useCallback((plan: WorkoutPlan) => {
    Alert.alert(
      'Delete Plan',
      `Delete "${plan.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePlan(plan._id) },
      ],
    );
  }, [deletePlan]);

  const handleCreate = useCallback(() => {
    navigation.navigate('PlanCreator');
  }, [navigation]);

  const handlePlanPress = useCallback((plan: WorkoutPlan) => {
    navigation.navigate('PlanDetail', { planId: plan._id });
  }, [navigation]);

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
        <Text style={styles.headerTitle}>My Plans</Text>
        <TouchableOpacity
          onPress={handleCreate}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.newText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && plans.length > 0}
            onRefresh={fetchPlans}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surfaceContainerHigh}
          />
        }
      >
        {isSaving && (
          <View style={styles.savingBanner}>
            <ActivityIndicator color={colors.onPrimary} size="small" />
            <Text style={styles.savingText}>Saving…</Text>
          </View>
        )}

        {isLoading && plans.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No plans yet</Text>
            <Text style={styles.emptySubtitle}>
              Build a training plan to stay on track day by day.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate}>
              <Text style={styles.emptyBtnText}>Create Your First Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map(plan => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onPress={() => handlePlanPress(plan)}
              onActivate={() => handleActivate(plan)}
              onDuplicate={() => handleDuplicate(plan)}
              onDelete={() => handleDelete(plan)}
              isSaving={isSaving}
            />
          ))
        )}
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
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  newText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
    flexGrow: 1,
  },

  // Saving banner
  savingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  savingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onPrimary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['4xl'],
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.lg,
    paddingHorizontal: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // Plan card
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardTop: {
    gap: spacing.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Card actions
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  actionBtnActivate: {
    backgroundColor: `${colors.primary}22`,
  },
  actionBtnDelete: {
    backgroundColor: `${colors.error}18`,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionBtnTextActivate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  actionBtnTextDelete: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
});
