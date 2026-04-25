import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTemplateStore } from '../../store/templateStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useUIStore } from '../../store/uiStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { Exercise } from '../../types/api';
import type { WorkoutsScreenProps } from '../../navigation/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreatorExercise {
  localId: string;
  exercise: Exercise;
  sets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
  notes: string;
}

const REST_PRESETS = [60, 90, 120, 180];

// ─── Exercise config card ─────────────────────────────────────────────────────

interface ExerciseCardProps {
  item: CreatorExercise;
  index: number;
  onChange: (localId: string, patch: Partial<CreatorExercise>) => void;
  onRemove: (localId: string) => void;
}

function ExerciseConfigCard({ item, index, onChange, onRemove }: ExerciseCardProps) {
  return (
    <View style={styles.exerciseCard}>
      {/* Header row */}
      <View style={styles.exCardHeader}>
        <Text style={styles.exCardIndex}>{index + 1}</Text>
        <Text style={styles.exCardName} numberOfLines={1}>
          {item.exercise.name}
        </Text>
        <TouchableOpacity
          onPress={() => onRemove(item.localId)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.exCardRemove}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.exCardMuscle}>{item.exercise.muscleGroup.toUpperCase()}</Text>

      {/* Sets */}
      <View style={styles.exRow}>
        <Text style={styles.exLabel}>SETS</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => onChange(item.localId, { sets: Math.max(1, item.sets - 1) })}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{item.sets}</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => onChange(item.localId, { sets: Math.min(20, item.sets + 1) })}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rep range */}
      <View style={styles.exRow}>
        <Text style={styles.exLabel}>REPS</Text>
        <View style={styles.repRow}>
          <TextInput
            style={styles.repInput}
            keyboardType="number-pad"
            value={String(item.repMin)}
            onChangeText={v => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 1) onChange(item.localId, { repMin: n });
            }}
            maxLength={3}
            selectTextOnFocus
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.repDash}>–</Text>
          <TextInput
            style={styles.repInput}
            keyboardType="number-pad"
            value={String(item.repMax)}
            onChangeText={v => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 1) onChange(item.localId, { repMax: n });
            }}
            maxLength={3}
            selectTextOnFocus
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.repLabel}>reps</Text>
        </View>
      </View>

      {/* Rest time */}
      <View style={styles.exRow}>
        <Text style={styles.exLabel}>REST</Text>
        <View style={styles.restChips}>
          {REST_PRESETS.map(sec => (
            <TouchableOpacity
              key={sec}
              style={[styles.restChip, item.restSeconds === sec && styles.restChipActive]}
              onPress={() => onChange(item.localId, { restSeconds: sec })}
            >
              <Text
                style={[styles.restChipText, item.restSeconds === sec && styles.restChipTextActive]}
              >
                {sec < 60 ? `${sec}s` : `${sec / 60}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes (optional) */}
      <TextInput
        style={styles.notesInput}
        placeholder="Notes (optional)"
        placeholderTextColor={colors.textMuted}
        value={item.notes}
        onChangeText={v => onChange(item.localId, { notes: v })}
        multiline
        numberOfLines={2}
      />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

let _localIdCounter = 0;
function newLocalId() {
  return `local_${++_localIdCounter}`;
}

export default function TemplateCreatorScreen({
  route,
  navigation,
}: WorkoutsScreenProps<'TemplateCreator'>) {
  const templateId = route.params?.templateId;
  const isEditing = !!templateId;

  const { selectedTemplate, isLoading, isSaving, fetchTemplateById, createTemplate, updateTemplate } =
    useTemplateStore();
  const { selectedExercise, setSelectedExercise } = useExerciseStore();
  const openOverlay = useUIStore(state => state.openOverlay);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<CreatorExercise[]>([]);
  const hasPreloaded = useRef(false);

  // Load template for editing
  useEffect(() => {
    if (isEditing && !hasPreloaded.current) {
      fetchTemplateById(templateId);
    }
  }, [isEditing, templateId, fetchTemplateById]);

  // Pre-populate form from loaded template
  useEffect(() => {
    if (isEditing && selectedTemplate && selectedTemplate._id === templateId && !hasPreloaded.current) {
      hasPreloaded.current = true;
      setName(selectedTemplate.name);
      setDescription(selectedTemplate.description ?? '');
      setExercises(
        selectedTemplate.exercises.map(ex => ({
          localId: newLocalId(),
          exercise: ex.exercise,
          sets: ex.sets,
          repMin: ex.repRange?.min ?? ex.exercise.defaultRepRange?.min ?? 6,
          repMax: ex.repRange?.max ?? ex.exercise.defaultRepRange?.max ?? 12,
          restSeconds: ex.restSeconds ?? 90,
          notes: ex.notes ?? '',
        })),
      );
    }
  }, [isEditing, selectedTemplate, templateId]);

  // Pick up exercise from ExercisePicker
  useEffect(() => {
    if (selectedExercise) {
      setExercises(prev => [
        ...prev,
        {
          localId: newLocalId(),
          exercise: selectedExercise,
          sets: 3,
          repMin: selectedExercise.defaultRepRange?.min ?? 6,
          repMax: selectedExercise.defaultRepRange?.max ?? 12,
          restSeconds: 90,
          notes: '',
        },
      ]);
      setSelectedExercise(null);
    }
  }, [selectedExercise, setSelectedExercise]);

  const handleChangeExercise = useCallback(
    (localId: string, patch: Partial<CreatorExercise>) => {
      setExercises(prev =>
        prev.map(ex => (ex.localId === localId ? { ...ex, ...patch } : ex)),
      );
    },
    [],
  );

  const handleRemoveExercise = useCallback((localId: string) => {
    setExercises(prev => prev.filter(ex => ex.localId !== localId));
  }, []);

  const handleAddExercise = useCallback(() => {
    openOverlay('exercisePicker', { context: 'template' });
  }, [openOverlay]);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a template name.');
      return;
    }

    const payload = {
      name: trimmed,
      description: description.trim() || undefined,
      exercises: exercises.map((ex, i) => ({
        exercise: ex.exercise._id,
        order: i,
        sets: ex.sets,
        repRange: { min: ex.repMin, max: ex.repMax },
        restSeconds: ex.restSeconds,
        notes: ex.notes.trim() || undefined,
      })),
    };

    let result: import('../../types/api').WorkoutTemplate | null;
    if (isEditing && templateId) {
      result = await updateTemplate(templateId, payload);
    } else {
      result = await createTemplate(payload);
    }

    if (result) {
      navigation.goBack();
    }
  }, [name, description, exercises, isEditing, templateId, createTemplate, updateTemplate, navigation]);

  const handleCancel = useCallback(() => {
    if (exercises.length > 0 || name.trim()) {
      Alert.alert('Discard changes?', 'Your unsaved template will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  }, [exercises, name, navigation]);

  if (isEditing && isLoading && !hasPreloaded.current) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderFull}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'EDIT TEMPLATE' : 'NEW TEMPLATE'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Template name */}
          <TextInput
            style={styles.nameInput}
            placeholder="Template name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoFocus={!isEditing}
          />

          {/* Description */}
          <TextInput
            style={styles.descInput}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />

          {/* Exercises */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              EXERCISES{exercises.length > 0 ? ` (${exercises.length})` : ''}
            </Text>

            {exercises.map((ex, idx) => (
              <ExerciseConfigCard
                key={ex.localId}
                item={ex}
                index={idx}
                onChange={handleChangeExercise}
                onRemove={handleRemoveExercise}
              />
            ))}

            <TouchableOpacity style={styles.addExBtn} onPress={handleAddExercise}>
              <Text style={styles.addExBtnPlus}>+</Text>
              <Text style={styles.addExBtnText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  cancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  saveText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
  },

  // Inputs
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  descInput: {
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
    textAlignVertical: 'top',
  },

  // Section
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  exCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exCardIndex: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  exCardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  exCardRemove: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  exCardMuscle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: -spacing.sm,
  },

  // Row layout
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  exLabel: {
    width: 40,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '400',
    lineHeight: 22,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },

  // Rep range
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  repInput: {
    width: 48,
    height: 36,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  repDash: {
    fontSize: 16,
    color: colors.textMuted,
  },
  repLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Rest chips
  restChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  restChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  restChipActive: {
    backgroundColor: colors.primary,
  },
  restChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  restChipTextActive: {
    color: colors.onPrimary,
  },

  // Notes
  notesInput: {
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    textAlignVertical: 'top',
  },

  // Add exercise button
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
  },
  addExBtnPlus: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '400',
    lineHeight: 24,
  },
  addExBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
