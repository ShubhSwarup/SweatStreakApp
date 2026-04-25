import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../../constants/colors';
import type { ExerciseTimePoint } from '../../types/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  data: ExerciseTimePoint[];
  field: 'weight' | 'estimated1RM' | 'volume';
  label?: string;
  unit?: string;
  width?: number;
  height?: number;
}

const CHART_CONFIG = {
  backgroundColor: colors.surfaceContainerHighest,
  backgroundGradientFrom: colors.surfaceContainerHighest,
  backgroundGradientTo: colors.surfaceContainerHighest,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(142, 255, 113, ${opacity})`,
  labelColor: () => colors.textMuted,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
    fill: colors.surfaceContainerHighest,
  },
  propsForBackgroundLines: { stroke: colors.outlineVariant, strokeDasharray: '' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ExerciseProgressChart({ data, field, label, unit, width, height = 180 }: Props) {
  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Log more sessions to see your trend</Text>
      </View>
    );
  }

  const values = data.map(d => d[field] as number);
  const labels = data.map(d => formatDate(d.date));

  const chartData = {
    labels,
    datasets: [{
      data: values,
      color: (opacity = 1) => `rgba(142, 255, 113, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  const chartWidth = width ?? SCREEN_WIDTH - 64;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <LineChart
        data={chartData}
        width={chartWidth}
        height={height}
        chartConfig={CHART_CONFIG}
        bezier
        withInnerLines={false}
        withOuterLines={false}
        withShadow={false}
        yAxisSuffix={unit ? ` ${unit}` : ''}
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chart: {
    borderRadius: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
