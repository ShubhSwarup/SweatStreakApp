import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useProgressStore } from '../../store/progressStore';
import CalendarGrid from '../../components/progress/CalendarGrid';
import VolumeBarChart from '../../components/progress/VolumeBarChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { formatDuration } from '../../utils/time';
import type { ProgressScreenProps } from '../../navigation/types';
import type { CalendarDayData, SessionHistoryItem } from '../../types/api';

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function relativeDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return formatShortDate(iso);
}

function WeekSummary({ weeklyData }: { weeklyData: Record<string, { volume: number; workouts: number }> }) {
  const total = Object.values(weeklyData).reduce(
    (acc, v) => ({ volume: acc.volume + v.volume, workouts: acc.workouts + v.workouts }),
    { volume: 0, workouts: 0 },
  );
  return (
    <View style={styles.weekRow}>
      <View style={styles.weekStat}>
        <Text style={styles.weekStatValue}>{total.workouts}</Text>
        <Text style={styles.weekStatLabel}>WORKOUTS</Text>
      </View>
      <View style={styles.weekDivider} />
      <View style={styles.weekStat}>
        <Text style={styles.weekStatValue}>
          {total.volume >= 1000 ? `${(total.volume / 1000).toFixed(1)}k` : total.volume}
        </Text>
        <Text style={styles.weekStatLabel}>KG VOLUME</Text>
      </View>
    </View>
  );
}

export default function ProgressHubScreen({ navigation }: ProgressScreenProps<'ProgressHub'>) {
  const {
    calendarData,
    sessionHistory,
    sessionsByDate,
    weeklyAnalytics,
    isCalendarLoading,
    isHistoryLoading,
    fetchCalendar,
    fetchSessionHistory,
    fetchWeeklyAnalytics,
  } = useProgressStore();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSessions, setPickerSessions] = useState<SessionHistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchCalendar();
      fetchSessionHistory(1, true);
      fetchWeeklyAnalytics();
    }, [fetchCalendar, fetchSessionHistory, fetchWeeklyAnalytics]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCalendar(),
      fetchSessionHistory(1, true),
      fetchWeeklyAnalytics(),
    ]);
    setRefreshing(false);
  }, [fetchCalendar, fetchSessionHistory, fetchWeeklyAnalytics]);

  const handleMonthChange = useCallback((startDate: string, endDate: string) => {
    fetchCalendar(startDate, endDate);
  }, [fetchCalendar]);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  }, [viewMonth]);

  const handleDayPress = useCallback((date: string, _dayData: CalendarDayData) => {
    const sessions = sessionsByDate[date] ?? [];
    if (sessions.length === 1) {
      navigation.navigate('PastSessionDetail', { sessionId: sessions[0]._id });
    } else if (sessions.length > 1) {
      setPickerSessions(sessions);
      setPickerVisible(true);
    }
  }, [sessionsByDate, navigation]);

  const isLoading = (isCalendarLoading || isHistoryLoading) && !calendarData && !sessionHistory.length;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surfaceContainerHigh}
          />
        }
      >
        <Text style={styles.screenTitle}>Progress</Text>

        {/* Activity Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVITY</Text>
          <CalendarGrid
            calendarData={calendarData}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        </View>

        {/* Weekly summary stats */}
        {weeklyAnalytics && Object.keys(weeklyAnalytics).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>THIS WEEK</Text>
            <View style={styles.card}>
              <WeekSummary weeklyData={weeklyAnalytics} />
            </View>
          </View>
        )}

        {/* Volume bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WEEKLY VOLUME</Text>
          <View style={styles.chartCard}>
            <VolumeBarChart weeklyData={weeklyAnalytics} height={160} />
          </View>
        </View>

        {/* Recent sessions */}
        {sessionHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
            <View style={styles.card}>
              {sessionHistory.slice(0, 8).map((session, idx) => (
                <React.Fragment key={session._id}>
                  {idx > 0 && <View style={styles.rowDivider} />}
                  <TouchableOpacity
                    style={styles.sessionRow}
                    onPress={() => navigation.navigate('PastSessionDetail', { sessionId: session._id })}
                    activeOpacity={0.75}
                  >
                    <View style={styles.sessionLeft}>
                      <Text style={styles.sessionName} numberOfLines={1}>{session.name}</Text>
                      <Text style={styles.sessionMeta}>
                        {relativeDate(session.startedAt)} · {formatDuration(session.durationSeconds)}
                      </Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {sessionHistory.length === 0 && !isHistoryLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts logged yet</Text>
            <Text style={styles.emptySubText}>
              Complete a workout to see your progress here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Session picker for days with multiple sessions */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.pickerTitle}>Select Session</Text>
            {pickerSessions.map(s => (
              <TouchableOpacity
                key={s._id}
                style={styles.pickerRow}
                onPress={() => {
                  setPickerVisible(false);
                  navigation.navigate('PastSessionDetail', { sessionId: s._id });
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.pickerName}>{s.name}</Text>
                <Text style={styles.pickerMeta}>{formatShortDate(s.startedAt)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },

  // Sections
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  chartCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
  },

  // Week summary
  weekRow: {
    flexDirection: 'row',
    padding: spacing.xl,
  },
  weekStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekDivider: {
    width: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: 4,
  },
  weekStatValue: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
  },
  weekStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },

  // Session rows
  rowDivider: {
    height: 1,
    backgroundColor: colors.surfaceContainerHighest,
    marginHorizontal: spacing.lg,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sessionLeft: {
    flex: 1,
    gap: 3,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  sessionMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: 22,
    color: colors.textMuted,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptySubText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Session picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
    gap: spacing.sm,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    padding: spacing.lg,
  },
  pickerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pickerMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
