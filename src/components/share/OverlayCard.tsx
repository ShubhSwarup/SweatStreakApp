import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../constants/colors';
import { radii } from '../../constants/spacing';
import { CARD_W, CARD_H } from './PRCard';

export interface OverlayCardProps {
  exercise: string;
  weight: number;
  reps: number;
  prBadge?: string;       // "+5 KG" — shown if provided
  volume: number;
  sets: number;
  duration: number;       // minutes
  streak: number;
  level: string;
  intensity: boolean;
}

// Glassmorphism helper — BlurView + semi-transparent container
function GlassModule({
  children,
  style,
  intensity = 20,
}: {
  children: React.ReactNode;
  style?: object;
  intensity?: number;
}) {
  return (
    <View style={[styles.glassOuter, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.glassInner}>{children}</View>
    </View>
  );
}

export default function OverlayCard({
  exercise,
  weight,
  reps,
  prBadge,
  volume,
  sets,
  duration,
  streak,
  level,
  intensity,
}: OverlayCardProps) {
  const volumeLabel = volume >= 1000 ? `${(volume / 1000).toFixed(1)}T` : `${Math.round(volume)} KG`;

  return (
    // Transparent root — background comes from user's photo in Instagram Stories
    <View style={styles.root}>

      {/* MODULE 1 — Streak badge (top-right) */}
      <GlassModule style={styles.mod1} intensity={18}>
        <Text style={styles.mod1Text}>🔥 {streak} DAY STREAK</Text>
      </GlassModule>

      {/* MODULE 2 — Main PR card (center, offset left) */}
      <GlassModule style={styles.mod2} intensity={24}>
        {prBadge && (
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>{prBadge} PR</Text>
          </View>
        )}
        <Text style={styles.mod2Exercise}>{exercise}</Text>
        <Text style={styles.mod2Hero}>{weight}KG × {reps}</Text>
      </GlassModule>

      {/* MODULE 3 — Stats row (bottom third) */}
      <GlassModule style={styles.mod3} intensity={22}>
        <StatModule icon="⚖️" value={volumeLabel} label="VOLUME" />
        <View style={styles.statRowDivider} />
        <StatModule icon="📋" value={`${sets}`} label="SETS" />
        <View style={styles.statRowDivider} />
        <StatModule icon="⏱" value={`${duration}M`} label="DURATION" />
      </GlassModule>

      {/* MODULE 4 — Intensity badge (below stats) */}
      {intensity && (
        <GlassModule style={styles.mod4} intensity={16}>
          <Text style={styles.mod4Text}>⚡ HIGH INTENSITY SESSION</Text>
        </GlassModule>
      )}

      {/* MODULE 5 — Level badge (bottom-left) */}
      <GlassModule style={styles.mod5} intensity={16}>
        <Text style={styles.mod5Text}>⭐ LEVEL: {level}</Text>
      </GlassModule>

    </View>
  );
}

function StatModule({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.statModule}>
      <Text style={styles.statModuleIcon}>{icon}</Text>
      <Text style={styles.statModuleValue}>{value}</Text>
      <Text style={styles.statModuleLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent root — no background, full Stories dimensions
  root: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: 'transparent',
  },

  // Shared glass module shell
  glassOuter: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  glassInner: {
    backgroundColor: 'rgba(30,32,29,0.40)',
    padding: 14,
  },

  // MODULE 1 — Streak pill (top-right)
  mod1: {
    top: 56,
    right: 20,
    borderRadius: radii.full,
  },
  mod1Text: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: colors.streak,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // MODULE 2 — Main PR card (center-left)
  mod2: {
    top: '32%',
    left: 20,
    width: CARD_W - 40,
    borderRadius: 24,
  },
  mod2Exercise: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  mod2Hero: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 56,
    color: colors.primary,
    lineHeight: 62,
    letterSpacing: -1.5,
  },
  prBadge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  prBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },

  // MODULE 3 — Stats row
  mod3: {
    bottom: 160,
    left: 20,
    right: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
  },
  statRowDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statModule: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  statModuleIcon: {
    fontSize: 18,
  },
  statModuleValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  statModuleLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },

  // MODULE 4 — Intensity badge
  mod4: {
    bottom: 100,
    left: 20,
    borderRadius: radii.full,
  },
  mod4Text: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.tertiary,
    letterSpacing: 1,
  },

  // MODULE 5 — Level badge
  mod5: {
    bottom: 48,
    left: 20,
    borderRadius: radii.full,
  },
  mod5Text: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: colors.xp,
    letterSpacing: 0.5,
  },
});
