import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useUIStore } from '../../store/uiStore';
import { calculatePlates } from '../../api/plateCalculator';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

const PLATE_COLORS: Record<number, string> = {
  25: '#C8102E',
  20: '#003DA5',
  15: '#FFD700',
  10: '#00843D',
  5: '#FFFFFF',
  2.5: '#E0E0E0',
  1.25: '#BDBDBD',
};

function PlateVisual({ plates }: { plates: number[] }) {
  if (plates.length === 0) {
    return (
      <View style={styles.emptyPlates}>
        <Text style={styles.emptyPlatesText}>Just the bar</Text>
      </View>
    );
  }
  return (
    <View style={styles.plateVisual}>
      {/* Bar */}
      <View style={styles.barSide} />
      {/* Plates (outside → inside, so reverse for visual) */}
      {[...plates].reverse().map((p, i) => {
        const heightPx = Math.max(20, Math.min(64, p * 2));
        return (
          <View
            key={i}
            style={[
              styles.plate,
              {
                height: heightPx,
                backgroundColor: PLATE_COLORS[p] ?? colors.outlineVariant,
              },
            ]}
          >
            <Text
              style={[
                styles.plateLabel,
                { color: p === 5 || p === 2.5 || p === 1.25 ? '#333' : '#fff' },
              ]}
            >
              {p}
            </Text>
          </View>
        );
      })}
      <View style={styles.barCenter} />
    </View>
  );
}

export default function PlateCalculatorSheet() {
  const { activeOverlay, overlayData, closeOverlay } = useUIStore();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  const initialWeight = (overlayData.currentWeight as number | undefined) ?? 0;
  const [targetWeight, setTargetWeight] = useState(
    initialWeight > 0 ? String(initialWeight) : '',
  );
  const [barWeight, setBarWeight] = useState('20');

  const isVisible = activeOverlay === 'plateCalculator';

  useEffect(() => {
    if (isVisible) {
      setTargetWeight(initialWeight > 0 ? String(initialWeight) : '');
      setBarWeight('20');
    }
  }, [isVisible, initialWeight]);

  const result = useMemo(() => {
    const tw = parseFloat(targetWeight);
    const bw = parseFloat(barWeight) || 20;
    if (!tw || tw <= 0) return null;
    return calculatePlates(tw, bw);
  }, [targetWeight, barWeight]);

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={closeOverlay}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>PLATE CALCULATOR</Text>

        {/* Inputs */}
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TARGET (kg)</Text>
            <TextInput
              style={styles.input}
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="e.g. 100"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>BAR (kg)</Text>
            <TextInput
              style={styles.input}
              value={barWeight}
              onChangeText={setBarWeight}
              placeholder="20"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>
        </View>

        {/* Result */}
        {result ? (
          <>
            <PlateVisual plates={result.platesPerSide} />
            <View style={styles.plateList}>
              <Text style={styles.plateListLabel}>PLATES PER SIDE</Text>
              {result.platesPerSide.length === 0 ? (
                <Text style={styles.plateListEmpty}>Just the bar ({barWeight} kg)</Text>
              ) : (
                <Text style={styles.plateListValue}>
                  {result.platesPerSide.join(' + ')} kg
                </Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Enter target weight above</Text>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.surfaceContainerHigh },
  handle: { backgroundColor: colors.outlineVariant, width: 36 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing['4xl'],
    gap: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  input: {
    height: 48,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  // Plate visual
  plateVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 80,
  },
  barSide: {
    width: 20,
    height: 8,
    backgroundColor: colors.outlineVariant,
    borderRadius: 4,
  },
  barCenter: {
    width: 20,
    height: 8,
    backgroundColor: colors.outlineVariant,
    borderRadius: 4,
  },
  plate: {
    width: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateLabel: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyPlates: {
    paddingVertical: spacing.xl,
  },
  emptyPlatesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Plate list
  plateList: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  plateListLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  plateListValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  plateListEmpty: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  placeholder: {
    paddingVertical: spacing['4xl'],
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
