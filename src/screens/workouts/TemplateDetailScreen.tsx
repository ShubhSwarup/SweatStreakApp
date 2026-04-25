import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTemplateStore } from '../../store/templateStore';
import { useSessionStore } from '../../store/sessionStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import type { PopulatedTemplateExercise } from '../../types/api';
import type { WorkoutsScreenProps } from '../../navigation/types';

function formatRepRange(ex: PopulatedTemplateExercise): string {
  if (ex.repRange) return `${ex.repRange.min}–${ex.repRange.max} reps`;
  if (ex.exercise.defaultRepRange) {
    return `${ex.exercise.defaultRepRange.min}–${ex.exercise.defaultRepRange.max} reps`;
  }
  return '—';
}

function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function TemplateDetailScreen({
  route,
  navigation,
}: WorkoutsScreenProps<'TemplateDetail'>) {
  const { templateId } = route.params;
  const { selectedTemplate, isLoading, isSaving, fetchTemplateById, deleteTemplate, clearSelectedTemplate } =
    useTemplateStore();
  const { startSession, isStarting } = useSessionStore();

  useEffect(() => {
    fetchTemplateById(templateId);
    return () => clearSelectedTemplate();
  }, [templateId, fetchTemplateById, clearSelectedTemplate]);

  const handleStartWorkout = useCallback(async () => {
    if (!selectedTemplate) return;
    await startSession(selectedTemplate.name, selectedTemplate._id);
    navigation.navigate('ActiveSession');
  }, [selectedTemplate, startSession, navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate('TemplateCreator', { templateId });
  }, [navigation, templateId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Template',
      `Delete "${selectedTemplate?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(templateId);
            navigation.goBack();
          },
        },
      ],
    );
  }, [selectedTemplate, deleteTemplate, templateId, navigation]);

  if (isLoading && !selectedTemplate) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderFull}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedTemplate) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderFull}>
          <Text style={styles.errorText}>Template not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }}>
            <Text style={styles.linkText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isUserTemplate = !selectedTemplate.isSystem;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerLabel}>TEMPLATE</Text>
        {isUserTemplate && (
          <TouchableOpacity onPress={handleDelete} disabled={isSaving}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
        {selectedTemplate.isSystem && <View style={{ width: 48 }} />}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.templateName}>{selectedTemplate.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {selectedTemplate.exercises.length} exercise{selectedTemplate.exercises.length !== 1 ? 's' : ''}
            </Text>
            {selectedTemplate.isSystem && (
              <Badge label="System" variant="default" />
            )}
          </View>
          {selectedTemplate.description ? (
            <Text style={styles.description}>{selectedTemplate.description}</Text>
          ) : null}
        </View>

        {/* Exercise list */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionLabel}>EXERCISES</Text>
          {selectedTemplate.exercises.map((ex, idx) => (
            <View key={idx} style={styles.exerciseRow}>
              <View style={styles.exerciseIndex}>
                <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                <View style={styles.exerciseStats}>
                  <Text style={styles.exerciseStat}>
                    {ex.sets} {ex.sets === 1 ? 'set' : 'sets'}
                  </Text>
                  <Text style={styles.exerciseStatDot}>·</Text>
                  <Text style={styles.exerciseStat}>{formatRepRange(ex)}</Text>
                  <Text style={styles.exerciseStatDot}>·</Text>
                  <Text style={styles.exerciseStat}>{formatRest(ex.restSeconds)} rest</Text>
                </View>
                {ex.notes ? (
                  <Text style={styles.exerciseNotes}>{ex.notes}</Text>
                ) : null}
              </View>
              <Badge label={ex.exercise.muscleGroup} variant="muscle" />
            </View>
          ))}
          {selectedTemplate.exercises.length === 0 && (
            <Text style={styles.emptyExercises}>No exercises in this template</Text>
          )}
        </View>
      </ScrollView>

      {/* CTA footer */}
      <View style={styles.footer}>
        <Button
          label="Start Workout"
          onPress={handleStartWorkout}
          loading={isStarting}
          disabled={isStarting}
        />
        {isUserTemplate && (
          <Button
            label="Edit Template"
            onPress={handleEdit}
            variant="secondary"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loaderFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 48,
  },
  backText: {
    fontSize: 22,
    color: colors.text,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    width: 48,
    textAlign: 'right',
  },

  // Content
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.xl,
  },
  titleSection: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  templateName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  // Exercises
  exercisesSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  exerciseIndex: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  exerciseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  exerciseStat: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  exerciseStatDot: {
    fontSize: 11,
    color: colors.textMuted,
  },
  exerciseNotes: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  emptyExercises: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
});
