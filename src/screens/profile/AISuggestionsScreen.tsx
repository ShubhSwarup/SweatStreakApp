import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import type { ProfileScreenProps } from '../../navigation/types';

// AI suggestions endpoint is not yet implemented on the backend.
// We show a polished coming-soon state with a preview of the feature.

interface SuggestionPreview {
  id: string;
  name: string;
  description: string;
  exercises: string[];
  reasoning: string;
  tag: string;
}

const PREVIEW_SUGGESTIONS: SuggestionPreview[] = [
  {
    id: '1',
    name: 'Upper Body Push Focus',
    description: 'Targets chest, shoulders, and triceps based on your recent volume gap.',
    exercises: ['Bench Press', 'Overhead Press', 'Lateral Raise', 'Tricep Dips'],
    reasoning: "You haven't hit shoulders in 6 days. This balances your weekly muscle distribution.",
    tag: 'BALANCE',
  },
  {
    id: '2',
    name: 'Progressive Overload Day',
    description: 'Builds on your best lifts from last week with targeted weight increases.',
    exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Calf Raise'],
    reasoning: 'Your squat hit 8 reps at top weight last session — time to progress.',
    tag: 'PROGRESSION',
  },
  {
    id: '3',
    name: 'Weak Point Attack',
    description: 'Isolation work for muscle groups with the lowest volume in your recent history.',
    exercises: ['Face Pulls', 'Rear Delt Fly', 'Bicep Curl', 'Hammer Curl'],
    reasoning: 'Your back training volume is 40% lower than chest — rear delts need attention.',
    tag: 'RECOVERY',
  },
];

function SuggestionCard({ suggestion }: { suggestion: SuggestionPreview }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{suggestion.tag}</Text>
        </View>
        <Text style={styles.cardName}>{suggestion.name}</Text>
      </View>

      <Text style={styles.cardDescription}>{suggestion.description}</Text>

      <View style={styles.exerciseList}>
        {suggestion.exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseChip}>
            <Text style={styles.exerciseChipText}>{ex}</Text>
          </View>
        ))}
      </View>

      <View style={styles.reasoningBox}>
        <Ionicons name="bulb-outline" size={14} color={colors.xp} style={styles.reasoningIcon} />
        <Text style={styles.reasoningText}>{suggestion.reasoning}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.cardBtn, styles.cardBtnDisabled]}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Coming Soon', 'AI suggestions will be available in a future update.')}
        >
          <Ionicons name="play" size={14} color={colors.textMuted} />
          <Text style={styles.cardBtnTextDisabled}>Start as Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cardBtn, styles.cardBtnDisabled]}
          activeOpacity={0.6}
          onPress={() => Alert.alert('Coming Soon', 'AI suggestions will be available in a future update.')}
        >
          <Ionicons name="bookmark-outline" size={14} color={colors.textMuted} />
          <Text style={styles.cardBtnTextDisabled}>Save as Template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AISuggestionsScreen({ navigation }: ProfileScreenProps<'AISuggestions'>) {
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
        <Text style={styles.headerTitle}>AI Suggestions</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coming soon banner */}
        <View style={styles.comingSoonBanner}>
          <View style={styles.comingSoonIconWrap}>
            <Ionicons name="sparkles" size={28} color={colors.primary} />
          </View>
          <View style={styles.comingSoonText}>
            <Text style={styles.comingSoonTitle}>AI Coaching — Coming Soon</Text>
            <Text style={styles.comingSoonSub}>
              Personalised workout recommendations based on your progression stats,
              recent history, and missed muscle groups.
            </Text>
          </View>
        </View>

        <Text style={styles.previewLabel}>PREVIEW</Text>
        <Text style={styles.previewSub}>
          Here's a glimpse of the suggestions you'll receive once AI coaching launches:
        </Text>

        {PREVIEW_SUGGESTIONS.map(s => (
          <SuggestionCard key={s.id} suggestion={s} />
        ))}

        <View style={styles.featureList}>
          <Text style={styles.featureListTitle}>What to expect</Text>
          {[
            'Personalised to your lifting history and current plan',
            'Detects weak points and volume gaps across muscle groups',
            'Progressive overload suggestions based on your recent PRs',
            'One tap to start the suggested workout or save as a template',
          ].map((feat, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.featureText}>{feat}</Text>
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

  // Coming soon banner
  comingSoonBanner: {
    backgroundColor: `${colors.primary}14`,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  comingSoonIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  comingSoonText: {
    flex: 1,
    gap: 6,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  comingSoonSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // Preview
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  previewSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: -spacing.sm,
  },

  // Card
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardHeader: {
    gap: spacing.sm,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.tertiary}22`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.tertiary,
    letterSpacing: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  exerciseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  exerciseChip: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  exerciseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.xp}10`,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  reasoningIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  reasoningText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerHighest,
  },
  cardBtnDisabled: {
    opacity: 0.5,
  },
  cardBtnTextDisabled: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },

  // Feature list
  featureList: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  featureListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
