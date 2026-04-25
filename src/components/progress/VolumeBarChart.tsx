import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors } from '../../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  weeklyData: Record<string, { volume: number; workouts: number }> | null;
  width?: number;
  height?: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayLabel(dateStr: string): string {
  return DAY_LABELS[new Date(dateStr).getDay()] ?? '';
}

const CHART_CONFIG = {
  backgroundColor: colors.surfaceContainerHigh,
  backgroundGradientFrom: colors.surfaceContainerHigh,
  backgroundGradientTo: colors.surfaceContainerHigh,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(142, 255, 113, ${opacity})`,
  labelColor: () => colors.textMuted,
  fillShadowGradient: colors.primary,
  fillShadowGradientOpacity: 1,
  barPercentage: 0.7,
  propsForBackgroundLines: { stroke: 'transparent' },
};

export default function VolumeBarChart({ weeklyData, width, height = 160 }: Props) {
  if (!weeklyData) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>Loading…</Text>
      </View>
    );
  }

  const entries = Object.entries(weeklyData).sort(([a], [b]) => a.localeCompare(b));

  if (entries.every(([, v]) => v.volume === 0)) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>No workouts this week</Text>
      </View>
    );
  }

  const labels = entries.map(([date]) => getDayLabel(date));
  const data = entries.map(([, v]) => Math.max(v.volume, 0.01));

  const chartData = { labels, datasets: [{ data }] };
  const chartWidth = width ?? SCREEN_WIDTH - 64;

  return (
    <BarChart
      data={chartData}
      width={chartWidth}
      height={height}
      chartConfig={CHART_CONFIG}
      yAxisLabel=""
      yAxisSuffix=""
      fromZero
      showValuesOnTopOfBars={false}
      withInnerLines={false}
      style={styles.chart}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  chart: {
    borderRadius: 12,
  },
});
