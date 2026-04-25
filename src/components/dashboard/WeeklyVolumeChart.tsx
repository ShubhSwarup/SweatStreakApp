import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

interface Props {
  volumeByDay: Record<string, number>;
  weeklyVolume: number;
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildChartData(volumeByDay: Record<string, number>) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return { idx: i, volume: volumeByDay[key] ?? 0, dow: DOW[d.getDay()] };
  });
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k kg`;
  return `${v} kg`;
}

export default function WeeklyVolumeChart({
  volumeByDay,
  weeklyVolume,
}: Props) {
  const chartData = useMemo(() => buildChartData(volumeByDay), [volumeByDay]);
  const maxVol = Math.max(...chartData.map(d => d.volume), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tag}>WEEKLY VOLUME</Text>
        <Text style={styles.total}>{formatVolume(weeklyVolume)}</Text>
      </View>

      <View style={styles.chartArea}>
        <View style={styles.chartArea}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              height: '100%',
            }}
          >
            {chartData.map((d, i) => {
              const height = (d.volume / maxVol) * 100;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: `${height}%`,
                      backgroundColor: colors.primary,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.labels}>
        {chartData.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>
            {d.dow}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  chartArea: {
    height: 120,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    width: 20,
    textAlign: 'center',
  },
});
