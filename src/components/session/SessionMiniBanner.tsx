import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationState } from '@react-navigation/native';
import { useSessionStore } from '../../store/sessionStore';
import { useSessionTimer, formatElapsed } from '../../hooks/useSessionTimer';
import { navigationRef } from '../../utils/navigation';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

function getDeepRouteName(state: any): string {
  if (!state) return '';
  const route = state.routes[state.index];
  if (route?.state) return getDeepRouteName(route.state);
  return route?.name ?? '';
}

export default function SessionMiniBanner() {
  const insets = useSafeAreaInsets();
  const activeSession = useSessionStore(s => s.activeSession);
  const currentRoute = useNavigationState(state => getDeepRouteName(state));

  const isOnActiveSession = currentRoute === 'ActiveSession';
  const elapsed = useSessionTimer(
    activeSession?.durationSeconds ?? 0,
    activeSession?.status === 'active',
  );

  if (!activeSession || isOnActiveSession) return null;

  const handleTap = () => {
    navigationRef.navigate('Main', { screen: 'WorkoutsTab', params: { screen: 'ActiveSession' } });
  };

  return (
    <TouchableOpacity
      style={[styles.banner, { bottom: insets.bottom + 60 }]}
      onPress={handleTap}
      activeOpacity={0.85}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.statusDot,
            activeSession.status === 'paused' && styles.statusDotPaused,
          ]}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {activeSession.name}
          </Text>
          <Text style={styles.status}>
            {activeSession.status === 'paused' ? 'PAUSED' : 'ACTIVE'}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: 62,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDotPaused: {
    backgroundColor: colors.warning,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.1,
  },
  status: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timer: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  arrow: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '300',
  },
});
