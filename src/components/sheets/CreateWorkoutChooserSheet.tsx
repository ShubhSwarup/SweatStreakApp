import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useUIStore } from '../../store/uiStore';
import { navigationRef } from '../../utils/navigation';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

function OptionCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.optionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.optionIcon}>
        <Text style={styles.optionIconText}>{icon}</Text>
      </View>
      <View style={styles.optionBody}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
      <Text style={styles.optionArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function CreateWorkoutChooserSheet() {
  const { activeOverlay, closeOverlay } = useUIStore();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['38%'], []);

  const isVisible = activeOverlay === 'createWorkoutChooser';

  const handleClose = useCallback(() => closeOverlay(), [closeOverlay]);

  const goToTemplateCreator = useCallback(() => {
    closeOverlay();
    navigationRef.navigate('Main', { screen: 'WorkoutsTab', params: { screen: 'TemplateCreator' } });
  }, [closeOverlay]);

  const goToPlanCreator = useCallback(() => {
    closeOverlay();
    navigationRef.navigate('Main', { screen: 'WorkoutsTab', params: { screen: 'PlanCreator' } });
  }, [closeOverlay]);

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
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Create a Workout</Text>

        <OptionCard
          icon="📋"
          title="Create a Template"
          description="Save a reusable set of exercises"
          onPress={goToTemplateCreator}
        />
        <OptionCard
          icon="📅"
          title="Build a Training Plan"
          description="Schedule workouts across multiple days"
          onPress={goToPlanCreator}
        />
      </BottomSheetView>
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
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconText: {
    fontSize: 22,
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  optionArrow: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
  },
});
