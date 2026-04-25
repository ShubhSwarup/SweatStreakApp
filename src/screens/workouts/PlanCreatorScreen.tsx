import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlanStore } from '../../store/planStore';
import { useTemplateStore } from '../../store/templateStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useUIStore } from '../../store/uiStore';
import { getExerciseById } from '../../api/exercises';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { WorkoutTemplate } from '../../types/api';

// ─── Local types ──────────────────────────────────────────────────────────────

interface LocalExercise {
  localId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
}

interface LocalDay {
  localId: string;
  type: 'workout' | 'rest';
  label: string;
  exerciseSource: 'template' | 'custom' | null;
  pickedTemplateId: string | null;
  pickedTemplateName: string | null;
  exercises: LocalExercise[];
}

let _idCounter = 0;
function uid() {
  return `lc_${++_idCounter}_${Date.now()}`;
}

function makeRestDay(): LocalDay {
  return {
    localId: uid(),
    type: 'rest',
    label: '',
    exerciseSource: null,
    pickedTemplateId: null,
    pickedTemplateName: null,
    exercises: [],
  };
}

function makeWorkoutDay(): LocalDay {
  return {
    localId: uid(),
    type: 'workout',
    label: '',
    exerciseSource: null,
    pickedTemplateId: null,
    pickedTemplateName: null,
    exercises: [],
  };
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.stepDots}>
      {[1, 2, 3].map(s => (
        <View
          key={s}
          style={[styles.stepDot, step === s && styles.stepDotActive, step > s && styles.stepDotDone]}
        />
      ))}
    </View>
  );
}

// ─── Template picker modal ────────────────────────────────────────────────────

function TemplatePicker({
  visible,
  onClose,
  onSelect,
  userTemplates,
  systemTemplates,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: WorkoutTemplate) => void;
  userTemplates: WorkoutTemplate[];
  systemTemplates: WorkoutTemplate[];
}) {
  const all = [...userTemplates, ...systemTemplates];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pick a Template</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {all.length === 0 ? (
          <View style={styles.modalEmpty}>
            <Text style={styles.modalEmptyText}>No templates available</Text>
          </View>
        ) : (
          <FlatList
            data={all}
            keyExtractor={t => t._id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => onSelect(item)}
                activeOpacity={0.75}
              >
                <View style={styles.modalItemLeft}>
                  <Text style={styles.modalItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.modalItemMeta}>
                    {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
                    {item.isSystem ? ' · System' : ''}
                  </Text>
                </View>
                <Text style={styles.modalItemArrow}>›</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.modalSep} />}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Exercise mini-row for day card ──────────────────────────────────────────

function ExerciseMiniRow({
  ex,
  index,
  onChangeSets,
  onRemove,
}: {
  ex: LocalExercise;
  index: number;
  onChangeSets: (localId: string, sets: number) => void;
  onRemove: (localId: string) => void;
}) {
  return (
    <View style={styles.exRow}>
      <Text style={styles.exRowIndex}>{index + 1}</Text>
      <View style={styles.exRowInfo}>
        <Text style={styles.exRowName} numberOfLines={1}>{ex.exerciseName}</Text>
        <Text style={styles.exRowMuscle}>{ex.muscleGroup.toUpperCase()}</Text>
      </View>
      <View style={styles.exRowStepper}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChangeSets(ex.localId, Math.max(1, ex.sets - 1))}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{ex.sets}×</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChangeSets(ex.localId, Math.min(20, ex.sets + 1))}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(ex.localId)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.exRowRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Day card ─────────────────────────────────────────────────────────────────

interface DayCardProps {
  day: LocalDay;
  index: number;
  totalDays: number;
  onChangeType: (localId: string, type: 'workout' | 'rest') => void;
  onChangeLabel: (localId: string, label: string) => void;
  onRemove: (localId: string) => void;
  onMoveUp: (localId: string) => void;
  onMoveDown: (localId: string) => void;
  onOpenTemplatePicker: (localId: string) => void;
  onAddExercises: (localId: string) => void;
  onClearTemplate: (localId: string) => void;
  onChangeSets: (dayLocalId: string, exLocalId: string, sets: number) => void;
  onRemoveExercise: (dayLocalId: string, exLocalId: string) => void;
}

function DayCard({
  day,
  index,
  totalDays,
  onChangeType,
  onChangeLabel,
  onRemove,
  onMoveUp,
  onMoveDown,
  onOpenTemplatePicker,
  onAddExercises,
  onClearTemplate,
  onChangeSets,
  onRemoveExercise,
}: DayCardProps) {
  return (
    <View style={styles.dayCard}>
      {/* Day header */}
      <View style={styles.dayCardHeader}>
        <Text style={styles.dayCardOrder}>Day {index + 1}</Text>
        <View style={styles.dayReorderBtns}>
          <TouchableOpacity
            style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
            onPress={() => onMoveUp(day.localId)}
            disabled={index === 0}
          >
            <Text style={styles.reorderBtnText}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderBtn, index === totalDays - 1 && styles.reorderBtnDisabled]}
            onPress={() => onMoveDown(day.localId)}
            disabled={index === totalDays - 1}
          >
            <Text style={styles.reorderBtnText}>↓</Text>
          </TouchableOpacity>
        </View>
        {totalDays > 1 && (
          <TouchableOpacity
            onPress={() => onRemove(day.localId)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dayCardRemove}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeBtn, day.type === 'workout' && styles.typeBtnActive]}
          onPress={() => onChangeType(day.localId, 'workout')}
        >
          <Text style={[styles.typeBtnText, day.type === 'workout' && styles.typeBtnTextActive]}>
            🏋️ Workout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, day.type === 'rest' && styles.typeBtnActive]}
          onPress={() => onChangeType(day.localId, 'rest')}
        >
          <Text style={[styles.typeBtnText, day.type === 'rest' && styles.typeBtnTextActive]}>
            💤 Rest
          </Text>
        </TouchableOpacity>
      </View>

      {/* Label */}
      <TextInput
        style={styles.dayLabel}
        placeholder={day.type === 'workout' ? 'Label (e.g. Push Day)' : 'Label (e.g. Active Recovery)'}
        placeholderTextColor={colors.textMuted}
        value={day.label}
        onChangeText={text => onChangeLabel(day.localId, text)}
        maxLength={50}
      />

      {/* Workout-day content */}
      {day.type === 'workout' && (
        <View style={styles.workoutContent}>
          {/* Template assigned */}
          {day.exerciseSource === 'template' && day.pickedTemplateName ? (
            <View style={styles.templateAssigned}>
              <View style={styles.templateAssignedLeft}>
                <Text style={styles.templateAssignedLabel}>FROM TEMPLATE</Text>
                <Text style={styles.templateAssignedName} numberOfLines={1}>
                  {day.pickedTemplateName}
                </Text>
                <Text style={styles.templateAssignedMeta}>
                  {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onClearTemplate(day.localId)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.templateClearBtn}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : day.exerciseSource === 'custom' ? (
            /* Custom exercises */
            <View style={styles.customExercises}>
              {day.exercises.map((ex, i) => (
                <ExerciseMiniRow
                  key={ex.localId}
                  ex={ex}
                  index={i}
                  onChangeSets={(exId, sets) => onChangeSets(day.localId, exId, sets)}
                  onRemove={exId => onRemoveExercise(day.localId, exId)}
                />
              ))}
              <TouchableOpacity
                style={styles.addExBtn}
                onPress={() => onAddExercises(day.localId)}
              >
                <Text style={styles.addExBtnText}>+ Add Exercise</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Nothing configured yet */
            <View style={styles.dayConfigOptions}>
              <TouchableOpacity
                style={styles.configOption}
                onPress={() => onOpenTemplatePicker(day.localId)}
              >
                <Text style={styles.configOptionIcon}>📋</Text>
                <View>
                  <Text style={styles.configOptionTitle}>Use Template</Text>
                  <Text style={styles.configOptionSub}>Pick an existing workout</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.configDivider}>
                <Text style={styles.configDividerText}>or</Text>
              </View>
              <TouchableOpacity
                style={styles.configOption}
                onPress={() => onAddExercises(day.localId)}
              >
                <Text style={styles.configOptionIcon}>✏️</Text>
                <View>
                  <Text style={styles.configOptionTitle}>Build Custom</Text>
                  <Text style={styles.configOptionSub}>Add exercises manually</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PlanCreatorScreen({ navigation, route }: {
  navigation: any;
  route: { params?: { planId?: string } };
}) {
  const planId = route?.params?.planId;
  const isEditing = !!planId;

  const { selectedPlan, isSaving, fetchPlanById, createPlan, updatePlan } = usePlanStore();
  const { userTemplates, systemTemplates, fetchUserTemplates, fetchSystemTemplates } = useTemplateStore();
  const { selectedExercise, setSelectedExercise } = useExerciseStore();
  const openOverlay = useUIStore(state => state.openOverlay);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [planName, setPlanName] = useState('');
  const [days, setDays] = useState<LocalDay[]>([makeWorkoutDay()]);
  const [isPreloading, setIsPreloading] = useState(isEditing);
  const [templatePickerDayId, setTemplatePickerDayId] = useState<string | null>(null);
  const editingDayRef = useRef<string | null>(null);
  const hasPreloaded = useRef(false);

  // Fetch templates for template picker
  useEffect(() => {
    fetchUserTemplates(1, true);
    fetchSystemTemplates(1, true);
  }, [fetchUserTemplates, fetchSystemTemplates]);

  // Load plan for editing
  useEffect(() => {
    if (isEditing && !hasPreloaded.current) {
      fetchPlanById(planId);
    }
  }, [isEditing, planId, fetchPlanById]);

  // Pre-populate form from loaded plan
  useEffect(() => {
    if (!isEditing || hasPreloaded.current) return;
    if (!selectedPlan || selectedPlan._id !== planId) return;

    hasPreloaded.current = true;
    setPlanName(selectedPlan.name);

    const sortedApiDays = [...selectedPlan.days].sort((a, b) => a.order - b.order);

    // Preload all exercise IDs in parallel
    const buildLocalDays = async () => {
      const localDays = await Promise.all(
        sortedApiDays.map(async (apiDay) => {
          if (apiDay.type === 'rest') {
            return {
              localId: uid(),
              type: 'rest' as const,
              label: apiDay.label ?? '',
              exerciseSource: null as null,
              pickedTemplateId: null,
              pickedTemplateName: null,
              exercises: [],
            };
          }
          const templateExercises = apiDay.template?.exercises ?? [];
          const localExercises = await Promise.all(
            templateExercises.map(async (ex, i) => {
              const exerciseId = typeof ex.exercise === 'string' ? ex.exercise : (ex.exercise as any)?._id ?? '';
              let exerciseName = 'Exercise';
              let muscleGroup = '';
              try {
                const full = await getExerciseById(exerciseId);
                exerciseName = full.name;
                muscleGroup = full.muscleGroup;
              } catch {
                // exercise fetch failed — keep defaults
              }
              return {
                localId: uid(),
                exerciseId,
                exerciseName,
                muscleGroup,
                sets: ex.sets,
                repMin: ex.repRange?.min ?? 6,
                repMax: ex.repRange?.max ?? 12,
                restSeconds: ex.restSeconds ?? 90,
              };
            }),
          );
          return {
            localId: uid(),
            type: 'workout' as const,
            label: apiDay.label ?? '',
            exerciseSource: (localExercises.length > 0 ? 'custom' : null) as 'custom' | null,
            pickedTemplateId: null,
            pickedTemplateName: null,
            exercises: localExercises,
          };
        }),
      );
      setDays(localDays);
      setIsPreloading(false);
    };

    buildLocalDays();
  }, [isEditing, planId, selectedPlan]);

  // Pick up exercise from ExercisePicker (context: 'plan')
  useEffect(() => {
    if (!selectedExercise || !editingDayRef.current) return;
    const targetDayId = editingDayRef.current;
    editingDayRef.current = null;

    setDays(prev =>
      prev.map(d => {
        if (d.localId !== targetDayId) return d;
        return {
          ...d,
          exerciseSource: 'custom',
          exercises: [
            ...d.exercises,
            {
              localId: uid(),
              exerciseId: selectedExercise._id,
              exerciseName: selectedExercise.name,
              muscleGroup: selectedExercise.muscleGroup,
              sets: 3,
              repMin: selectedExercise.defaultRepRange?.min ?? 6,
              repMax: selectedExercise.defaultRepRange?.max ?? 12,
              restSeconds: 90,
            },
          ],
        };
      }),
    );
    setSelectedExercise(null);
  }, [selectedExercise, setSelectedExercise]);

  // ─── Day mutations ────────────────────────────────────────────────────────

  const handleAddWorkoutDay = () => setDays(prev => [...prev, makeWorkoutDay()]);
  const handleAddRestDay = () => setDays(prev => [...prev, makeRestDay()]);

  const handleChangeType = useCallback((localId: string, type: 'workout' | 'rest') => {
    setDays(prev =>
      prev.map(d =>
        d.localId === localId
          ? { ...d, type, exerciseSource: null, pickedTemplateId: null, pickedTemplateName: null, exercises: [] }
          : d,
      ),
    );
  }, []);

  const handleChangeLabel = useCallback((localId: string, label: string) => {
    setDays(prev => prev.map(d => (d.localId === localId ? { ...d, label } : d)));
  }, []);

  const handleRemoveDay = useCallback((localId: string) => {
    setDays(prev => prev.filter(d => d.localId !== localId));
  }, []);

  const handleMoveUp = useCallback((localId: string) => {
    setDays(prev => {
      const idx = prev.findIndex(d => d.localId === localId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((localId: string) => {
    setDays(prev => {
      const idx = prev.findIndex(d => d.localId === localId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleOpenTemplatePicker = useCallback((localId: string) => {
    setTemplatePickerDayId(localId);
  }, []);

  const handleTemplateSelect = useCallback((template: WorkoutTemplate) => {
    if (!templatePickerDayId) return;
    const dayId = templatePickerDayId;
    setTemplatePickerDayId(null);

    const exercises: LocalExercise[] = template.exercises.map((ex, i) => ({
      localId: uid(),
      exerciseId: typeof ex.exercise === 'string' ? ex.exercise : (ex.exercise as any)?._id ?? '',
      exerciseName: (ex.exercise as any)?.name ?? `Exercise ${i + 1}`,
      muscleGroup: (ex.exercise as any)?.muscleGroup ?? '',
      sets: ex.sets,
      repMin: ex.repRange?.min ?? 6,
      repMax: ex.repRange?.max ?? 12,
      restSeconds: ex.restSeconds ?? 90,
    }));

    setDays(prev =>
      prev.map(d =>
        d.localId === dayId
          ? {
              ...d,
              exerciseSource: 'template',
              pickedTemplateId: template._id,
              pickedTemplateName: template.name,
              exercises,
            }
          : d,
      ),
    );
  }, [templatePickerDayId]);

  const handleClearTemplate = useCallback((localId: string) => {
    setTemplatePickerDayId(localId);
  }, []);

  const handleAddExercises = useCallback((localId: string) => {
    editingDayRef.current = localId;
    openOverlay('exercisePicker', { context: 'plan' });
  }, [openOverlay]);

  const handleChangeSets = useCallback((dayLocalId: string, exLocalId: string, sets: number) => {
    setDays(prev =>
      prev.map(d =>
        d.localId === dayLocalId
          ? { ...d, exercises: d.exercises.map(ex => ex.localId === exLocalId ? { ...ex, sets } : ex) }
          : d,
      ),
    );
  }, []);

  const handleRemoveExercise = useCallback((dayLocalId: string, exLocalId: string) => {
    setDays(prev =>
      prev.map(d => {
        if (d.localId !== dayLocalId) return d;
        const filtered = d.exercises.filter(ex => ex.localId !== exLocalId);
        return {
          ...d,
          exercises: filtered,
          exerciseSource: filtered.length === 0 ? null : d.exerciseSource,
        };
      }),
    );
  }, []);

  // ─── Step navigation ──────────────────────────────────────────────────────

  const handleStep1Next = () => {
    if (!planName.trim()) {
      Alert.alert('Name required', 'Please enter a plan name.');
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    const workoutDays = days.filter(d => d.type === 'workout');
    const unconfigured = workoutDays.filter(d => d.exerciseSource === null);
    if (unconfigured.length > 0) {
      Alert.alert(
        'Incomplete days',
        'Each workout day needs at least a template or one exercise. Tap "Use Template" or "Build Custom" on each workout day.',
      );
      return;
    }
    const emptyWorkouts = workoutDays.filter(d => d.exercises.length === 0);
    if (emptyWorkouts.length > 0) {
      Alert.alert('No exercises', 'Each workout day needs at least one exercise.');
      return;
    }
    setStep(3);
  };

  const handleBack = () => {
    if (step === 1) {
      handleCancel();
    } else {
      setStep(s => (s - 1) as 1 | 2 | 3);
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard changes?', 'Your unsaved plan will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const payload = {
      name: planName.trim(),
      days: days.map((day, index) => {
        if (day.type === 'rest') {
          return {
            type: 'rest' as const,
            label: day.label.trim() || undefined,
          };
        }
        const exercises = day.exercises.map((ex, i) => ({
          exercise: ex.exerciseId,
          order: i,
          sets: ex.sets,
          repRange: { min: ex.repMin, max: ex.repMax },
          restSeconds: ex.restSeconds,
        }));
        return {
          type: 'workout' as const,
          label: day.label.trim() || undefined,
          exercises,
        };
      }),
    };

    let result;
    if (isEditing && planId) {
      result = await updatePlan(planId, payload);
    } else {
      result = await createPlan(payload);
    }

    if (result) {
      navigation.goBack();
    } else {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} plan. Please try again.`);
    }
  }, [planName, days, isEditing, planId, createPlan, updatePlan, navigation]);

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isPreloading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderFull}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loaderText}>Loading plan…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render steps ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.headerBack}>{step === 1 ? 'Cancel' : '‹ Back'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'EDIT PLAN' : 'NEW PLAN'}
            </Text>
            <StepDots step={step} />
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* ── Step 1: Plan name ─────────────────────────────────────── */}
        {step === 1 && (
          <ScrollView
            contentContainerStyle={styles.stepContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepHeading}>Name your plan</Text>
            <Text style={styles.stepSub}>Give your training plan a memorable name.</Text>

            <TextInput
              style={styles.nameInput}
              placeholder="e.g. Push Pull Legs"
              placeholderTextColor={colors.textMuted}
              value={planName}
              onChangeText={setPlanName}
              maxLength={100}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={handleStep1Next}
            />

            <TouchableOpacity style={styles.nextBtn} onPress={handleStep1Next}>
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── Step 2: Day builder ───────────────────────────────────── */}
        {step === 2 && (
          <>
            <ScrollView
              contentContainerStyle={styles.stepContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepHeading}>Add days</Text>
              <Text style={styles.stepSub}>
                Build your {days.length}-day schedule. Plan advances day-by-day as you complete workouts.
              </Text>

              {days.map((day, index) => (
                <DayCard
                  key={day.localId}
                  day={day}
                  index={index}
                  totalDays={days.length}
                  onChangeType={handleChangeType}
                  onChangeLabel={handleChangeLabel}
                  onRemove={handleRemoveDay}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onOpenTemplatePicker={handleOpenTemplatePicker}
                  onAddExercises={handleAddExercises}
                  onClearTemplate={handleClearTemplate}
                  onChangeSets={handleChangeSets}
                  onRemoveExercise={handleRemoveExercise}
                />
              ))}

              {/* Add day buttons */}
              <View style={styles.addDayBtns}>
                <TouchableOpacity style={styles.addDayBtn} onPress={handleAddWorkoutDay}>
                  <Text style={styles.addDayBtnText}>+ Workout Day</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addDayBtn} onPress={handleAddRestDay}>
                  <Text style={styles.addDayBtnText}>+ Rest Day</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.nextBtn} onPress={handleStep2Next}>
                <Text style={styles.nextBtnText}>Review Plan →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Step 3: Review ────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <ScrollView
              contentContainerStyle={styles.stepContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepHeading}>{planName}</Text>
              <Text style={styles.stepSub}>
                {days.length} day plan · {days.filter(d => d.type === 'workout').length} workout days
              </Text>

              {days.map((day, index) => {
                const isWorkout = day.type === 'workout';
                const summary = isWorkout
                  ? (day.exerciseSource === 'template' && day.pickedTemplateName
                      ? `From "${day.pickedTemplateName}"`
                      : `${day.exercises.length} exercise${day.exercises.length !== 1 ? 's' : ''}`)
                  : 'Rest';
                return (
                  <View key={day.localId} style={styles.reviewDay}>
                    <View style={styles.reviewDayIcon}>
                      <Text style={styles.reviewDayIconText}>{isWorkout ? '🏋️' : '💤'}</Text>
                    </View>
                    <View style={styles.reviewDayInfo}>
                      <Text style={styles.reviewDayLabel}>
                        Day {index + 1}{day.label ? ` — ${day.label}` : ''}
                      </Text>
                      <Text style={styles.reviewDaySummary}>{summary}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Save Changes' : 'Create & Activate Plan'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Template picker modal */}
        <TemplatePicker
          visible={templatePickerDayId !== null}
          onClose={() => setTemplatePickerDayId(null)}
          onSelect={handleTemplateSelect}
          userTemplates={userTemplates}
          systemTemplates={systemTemplates}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loaderFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loaderText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBack: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    minWidth: 70,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  headerRight: {
    minWidth: 70,
  },

  // Step dots
  stepDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  stepDotDone: {
    backgroundColor: `${colors.primary}60`,
  },

  // Step content
  stepContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
    gap: spacing.xl,
  },
  stepHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  stepSub: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: -spacing.md,
  },

  // Step 1 inputs
  nameInput: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },

  // Next button
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },

  // Save button
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // Day card
  dayCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayCardOrder: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    flex: 1,
  },
  dayReorderBtns: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  reorderBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderBtnDisabled: {
    opacity: 0.25,
  },
  reorderBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dayCardRemove: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },

  // Type toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    padding: 3,
    gap: 3,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm - 2,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeBtnTextActive: {
    color: colors.text,
  },

  // Day label
  dayLabel: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
  },

  // Workout content
  workoutContent: {
    gap: spacing.sm,
  },

  // Template assigned
  templateAssigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}14`,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.md,
  },
  templateAssignedLeft: {
    flex: 1,
    gap: 2,
  },
  templateAssignedLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  templateAssignedName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  templateAssignedMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  templateClearBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Custom exercises
  customExercises: {
    gap: spacing.sm,
  },

  // Exercise mini row
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  exRowIndex: {
    width: 18,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  exRowInfo: {
    flex: 1,
    gap: 1,
  },
  exRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  exRowMuscle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  exRowStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '400',
    lineHeight: 20,
  },
  stepValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  exRowRemove: {
    fontSize: 13,
    color: colors.textMuted,
    paddingLeft: spacing.xs,
  },

  // Add exercise button
  addExBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addExBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Day config options (unconfigured state)
  dayConfigOptions: {
    gap: spacing.sm,
  },
  configOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.md,
  },
  configOptionIcon: {
    fontSize: 20,
  },
  configOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  configOptionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  configDivider: {
    alignItems: 'center',
  },
  configDividerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Add day buttons
  addDayBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addDayBtn: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addDayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Review step
  reviewDay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  reviewDayIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewDayIconText: {
    fontSize: 18,
  },
  reviewDayInfo: {
    flex: 1,
    gap: 3,
  },
  reviewDayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  reviewDaySummary: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Template picker modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing['3xl'],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modalClose: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.sm,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalItemLeft: {
    flex: 1,
    gap: 3,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalItemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalItemArrow: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '300',
  },
  modalSep: {
    height: spacing.xs,
  },
  modalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['4xl'],
  },
  modalEmptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
