import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useUIStore } from '../../store/uiStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useSessionStore } from '../../store/sessionStore';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import Badge from '../common/Badge';
import type { Exercise, MuscleGroup } from '../../types/api';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'legs', 'biceps',
  'triceps', 'core', 'glutes', 'calves', 'cardio',
];

export type PickerContext = 'session' | 'template' | 'plan';

interface ExerciseRowProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
  onAdd: (exercise: Exercise) => void;
  showAdd: boolean;
}

function ExerciseRow({ exercise, onPress, onAdd, showAdd }: ExerciseRowProps) {
  return (
    <TouchableOpacity style={styles.exerciseRow} onPress={() => onPress(exercise)} activeOpacity={0.75}>
      <View style={styles.exerciseLeft}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseMeta}>
          <Text style={styles.exerciseMetaText}>
            {exercise.exerciseType === 'cardio' ? 'CARDIO' : 'STRENGTH'}
          </Text>
          <Text style={styles.exerciseMetaDot}>·</Text>
          <Text style={styles.exerciseMetaText}>
            {exercise.trackingType.toUpperCase()}
          </Text>
          <Text style={styles.exerciseMetaDot}>·</Text>
          <Text style={[styles.exerciseMetaText, { color: colors.textSecondary }]}>
            {exercise.muscleGroup.toUpperCase()}
          </Text>
        </View>
      </View>
      {showAdd && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onAdd(exercise)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function ExercisePickerSheet() {
  const { activeOverlay, overlayData, openOverlay, closeOverlay } = useUIStore();
  const {
    exercises,
    pagination,
    muscleGroupFilter,
    isLoading,
    fetchExercises,
    fetchSuggested,
    setSearchQuery,
    setMuscleGroupFilter,
    setSelectedExercise,
    resetExercises,
  } = useExerciseStore();
  const { activeSession, addExercise } = useSessionStore();

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '95%'], []);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  const isVisible = activeOverlay === 'exercisePicker';
  const context = (overlayData.context as PickerContext) ?? 'session';

  useEffect(() => {
    if (isVisible) {
      resetExercises();
      fetchExercises(1, true);
      fetchSuggested(undefined, 10);
    }
  }, [isVisible]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setLocalSearch(text);
      if (searchTimeout.current !== null) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setSearchQuery(text);
        fetchExercises(1, true);
      }, 350);
    },
    [setSearchQuery, fetchExercises],
  );

  const handleFilterPress = useCallback(
    (group: MuscleGroup | null) => {
      setMuscleGroupFilter(group);
    },
    [setMuscleGroupFilter],
  );

  const handleExercisePress = useCallback(
    (exercise: Exercise) => {
      openOverlay('exerciseDetail', {
        exerciseId: exercise._id,
        context,
        fromPicker: true,
      });
    },
    [openOverlay, context],
  );

  const handleAddDirect = useCallback(
    async (exercise: Exercise) => {
      if (context === 'session' && activeSession) {
        await addExercise(exercise._id);
        closeOverlay();
      } else if (context === 'template' || context === 'plan') {
        setSelectedExercise(exercise);
        closeOverlay();
      } else {
        handleExercisePress(exercise);
      }
    },
    [context, activeSession, addExercise, closeOverlay, handleExercisePress, setSelectedExercise],
  );

  const handleLoadMore = useCallback(() => {
    if (!pagination) return;
    const { page, pages } = pagination;
    if (page < pages && !isLoading) {
      fetchExercises(page + 1, false);
    }
  }, [pagination, isLoading, fetchExercises]);

  const handleClose = useCallback(() => {
    closeOverlay();
  }, [closeOverlay]);

  const showAdd = (context === 'session' && activeSession !== null) || context === 'template' || context === 'plan';

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseRow
        exercise={item}
        onPress={handleExercisePress}
        onAdd={handleAddDirect}
        showAdd={showAdd}
      />
    ),
    [handleExercisePress, handleAddDirect, showAdd],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }, [isLoading]);

  const keyExtractor = useCallback((item: Exercise) => item._id, []);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Exercises</Text>
        <TouchableOpacity onPress={closeOverlay} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <BottomSheetTextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textMuted}
          value={localSearch}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Muscle group filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[styles.chip, muscleGroupFilter === null && styles.chipActive]}
          onPress={() => handleFilterPress(null)}
        >
          <Text style={[styles.chipText, muscleGroupFilter === null && styles.chipTextActive]}>
            ALL
          </Text>
        </TouchableOpacity>
        {MUSCLE_GROUPS.map(group => (
          <TouchableOpacity
            key={group}
            style={[styles.chip, muscleGroupFilter === group && styles.chipActive]}
            onPress={() => handleFilterPress(group)}
          >
            <Text
              style={[styles.chipText, muscleGroupFilter === group && styles.chipTextActive]}
            >
              {group.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise list */}
      <BottomSheetFlatList
        data={exercises}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No exercises found</Text>
            </View>
          )
        }
      />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  searchInput: {
    height: 46,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.text,
  },

  // Filter chips
  filtersContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  exerciseLeft: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseMetaText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  exerciseMetaDot: {
    fontSize: 10,
    color: colors.textMuted,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 18,
    color: colors.onPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },

  // Footer / Empty
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
