import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { ProfileScreenProps } from '../../navigation/types';

const FEATURE_PREVIEWS = [
  {
    icon: 'person-add-outline' as const,
    title: 'Follow Friends',
    description: 'Connect with training partners and follow their progress in real time.',
  },
  {
    icon: 'barbell-outline' as const,
    title: 'See Their Workouts',
    description: 'View recent sessions, PRs, and streaks from the people you follow.',
  },
  {
    icon: 'trophy-outline' as const,
    title: 'Compare Volume',
    description: 'Weekly volume leaderboard with your friends — friendly competition drives consistency.',
  },
  {
    icon: 'flame-outline' as const,
    title: 'Streak Battles',
    description: 'Challenge friends to streak battles and earn bonus XP for winning.',
  },
];

function FeatureCard({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </View>
  );
}

export default function FriendsScreen({ navigation }: ProfileScreenProps<'Friends'>) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="people" size={40} color={colors.primary} />
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>COMING SOON</Text>
          </View>
          <Text style={styles.heroTitle}>Train Together</Text>
          <Text style={styles.heroSub}>
            The social layer of SweatStreak is in development.
            Follow friends, compete on streaks, and push each other to be consistent.
          </Text>
        </View>

        {/* Feature previews */}
        <Text style={styles.sectionLabel}>WHAT'S COMING</Text>
        <View style={styles.featureList}>
          {FEATURE_PREVIEWS.map((feat, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.divider} />}
              <FeatureCard {...feat} />
            </React.Fragment>
          ))}
        </View>

        {/* Placeholder search */}
        <View style={styles.searchPlaceholder}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <Text style={styles.searchPlaceholderText}>Find friends by username…</Text>
          <View style={styles.searchDisabledBadge}>
            <Text style={styles.searchDisabledText}>Soon</Text>
          </View>
        </View>

        {/* Mock leaderboard */}
        <Text style={styles.sectionLabel}>STREAK LEADERBOARD (PREVIEW)</Text>
        <View style={styles.leaderboard}>
          {[
            { rank: 1, name: 'You', streak: '—', isYou: true },
            { rank: 2, name: 'alex_lifts', streak: '—', isYou: false },
            { rank: 3, name: 'maria.fit', streak: '—', isYou: false },
          ].map(item => (
            <View key={item.rank} style={[styles.leaderRow, item.isYou && styles.leaderRowYou]}>
              <Text style={[styles.leaderRank, item.rank === 1 && styles.leaderRankGold]}>
                #{item.rank}
              </Text>
              <View style={styles.leaderAvatar}>
                <Text style={styles.leaderAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[styles.leaderName, item.isYou && styles.leaderNameYou]}>
                {item.name}
              </Text>
              <View style={styles.leaderStreakPill}>
                <Text style={styles.leaderStreakText}>{item.streak}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    minWidth: 60,
  },

  // Content
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },

  // Hero
  hero: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    backgroundColor: `${colors.secondary}22`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },

  // Feature list
  featureList: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceContainerHighest,
  },

  // Search placeholder
  searchPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    opacity: 0.5,
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 15,
    color: colors.textMuted,
  },
  searchDisabledBadge: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  searchDisabledText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  // Leaderboard
  leaderboard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  leaderRowYou: {
    // subtle highlight handled by name color
  },
  leaderRank: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    width: 28,
  },
  leaderRankGold: {
    color: colors.xp,
  },
  leaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  leaderName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  leaderNameYou: {
    color: colors.primary,
    fontWeight: '700',
  },
  leaderStreakPill: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  leaderStreakText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
