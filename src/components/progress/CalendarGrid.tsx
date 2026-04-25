import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import type { CalendarDayData } from '../../types/api';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

interface Props {
  calendarData: Record<string, CalendarDayData> | null;
  onDayPress: (date: string, dayData: CalendarDayData) => void;
  onMonthChange?: (startDate: string, endDate: string) => void;
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function CalendarGrid({
  calendarData,
  onDayPress,
  onMonthChange,
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const today = new Date();
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  useEffect(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    onMonthChange?.(
      toDateKey(viewYear, viewMonth, 1),
      toDateKey(viewYear, viewMonth, daysInMonth),
    );
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = Array.from({ length: cells.length / 7 }, (_, i) =>
    cells.slice(i * 7, i * 7 + 7),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onPrevMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity
          onPress={onNextMonth}
          disabled={isCurrentMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.navArrow, isCurrentMonth && styles.navDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daysHeader}>
        {DAYS.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.cell} />;

            const dateKey = toDateKey(viewYear, viewMonth, day);
            const dayData = calendarData?.[dateKey];
            const hasWorkout = !!(dayData?.workouts?.length);
            const hasPR = dayData?.hasPR ?? false;
            const isToday = dateKey === todayKey;

            return (
              <TouchableOpacity
                key={di}
                style={styles.cell}
                onPress={() => hasWorkout && dayData && onDayPress(dateKey, dayData)}
                activeOpacity={hasWorkout ? 0.7 : 1}
                disabled={!hasWorkout}
              >
                <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
                  {day}
                </Text>
                {hasWorkout && (
                  <View style={[styles.dot, hasPR && styles.dotPR]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 24,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navArrow: {
    fontSize: 26,
    color: colors.text,
    fontWeight: '300',
    lineHeight: 30,
  },
  navDisabled: {
    color: colors.textMuted,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cell: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  todayNumber: {
    color: colors.primary,
    fontWeight: '800',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  dotPR: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
});
