import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PRCard, { CARD_W, CARD_H, type PRCardProps } from './PRCard';
import SessionIdentityCard, { type SessionIdentityCardProps } from './SessionIdentityCard';
import OverlayCard, { type OverlayCardProps } from './OverlayCard';
import { captureCard, shareToInstagram, saveToLibrary } from '../../utils/shareWorkout';
import { generateCaption } from '../../utils/generateCaption';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { log } from '../../utils/logger';

export type ShareTemplate = 'pr' | 'session' | 'overlay';

// Unified data shape — parent fills all fields it can; card components handle optional ones
export interface ShareData {
  // Common
  volume: number;
  sets: number;
  duration: number;       // minutes
  streak: number;
  intensity: boolean;
  date: string;
  level: string;          // "ADVANCED"
  // PR fields
  prExercise: string;
  prType: PRCardProps['prType'];
  prNewValue: number;
  prNewReps?: number;
  prOldValue?: number;
  // Session identity fields
  workoutName: string;
  muscleGroup: string;
  percentile?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  shareData: ShareData;
  defaultTemplate: ShareTemplate;
}

const CHIPS: { id: ShareTemplate; label: string }[] = [
  { id: 'overlay',  label: 'Overlay' },
  { id: 'pr',       label: 'PR Card' },
  { id: 'session',  label: 'Session Card' },
];

const SCREEN_W = Dimensions.get('window').width;
// Preview scale so CARD_W fits within screen padding
const PREVIEW_SCALE = Math.min(1, (SCREEN_W - spacing.lg * 2) / CARD_W);

type ShareState = 'idle' | 'capturing' | 'sharing' | 'saving';

export default function SharePreviewScreen({ visible, onClose, shareData, defaultTemplate }: Props) {
  const cardRef    = useRef<View>(null);
  const overlayRef = useRef<View>(null);  // transparent-only for overlay template

  const [template, setTemplate]     = useState<ShareTemplate>(defaultTemplate);
  const [caption, setCaption]       = useState(() => generateCaption(defaultTemplate, shareData));
  const [shareState, setShareState] = useState<ShareState>('idle');

  const isBusy = shareState !== 'idle';

  React.useEffect(() => {
    if (visible) {
      setTemplate(defaultTemplate);
      setCaption(generateCaption(defaultTemplate, shareData));
    }
  }, [visible, defaultTemplate]);

  const handleTemplateChange = (t: ShareTemplate) => {
    setTemplate(t);
    setCaption(generateCaption(t, shareData));
  };

  const getActiveRef = () => template === 'overlay' ? overlayRef : cardRef;

  const handleShare = async () => {
    setShareState('capturing');
    try {
      const uri = await captureCard(getActiveRef());
      setShareState('sharing');
      await shareToInstagram(uri);
    } catch (err) {
      log.error('SharePreviewScreen', 'share failed:', err);
      Alert.alert('Share failed', 'Could not capture the card. Please try again.');
    } finally {
      setShareState('idle');
    }
  };

  const handleSave = async () => {
    setShareState('capturing');
    try {
      const uri = await captureCard(getActiveRef());
      setShareState('saving');
      const saved = await saveToLibrary(uri);
      if (saved) Alert.alert('Saved!', 'Your card has been saved to Photos.');
    } catch (err) {
      log.error('SharePreviewScreen', 'save failed:', err);
      Alert.alert('Save failed', 'Could not save the card. Please try again.');
    } finally {
      setShareState('idle');
    }
  };

  // Derive card-specific props from unified ShareData
  const prProps: PRCardProps = {
    exercise:  shareData.prExercise,
    prType:    shareData.prType,
    newValue:  shareData.prNewValue,
    newReps:   shareData.prNewReps,
    oldValue:  shareData.prOldValue,
    volume:    shareData.volume,
    sets:      shareData.sets,
    duration:  shareData.duration,
    streak:    shareData.streak,
    intensity: shareData.intensity,
    date:      shareData.date,
  };

  const sessionProps: SessionIdentityCardProps = {
    workoutName:  shareData.workoutName,
    volume:       shareData.volume,
    duration:     shareData.duration,
    sets:         shareData.sets,
    muscleGroup:  shareData.muscleGroup,
    intensity:    shareData.intensity,
    streak:       shareData.streak,
    level:        shareData.level,
    percentile:   shareData.percentile,
    date:         shareData.date,
  };

  const overlayProps: OverlayCardProps = {
    exercise:  shareData.prExercise,
    weight:    shareData.prNewValue,
    reps:      shareData.prNewReps ?? 0,
    prBadge:   shareData.prOldValue != null ? `+${+(shareData.prNewValue - shareData.prOldValue).toFixed(1)} KG` : undefined,
    volume:    shareData.volume,
    sets:      shareData.sets,
    duration:  shareData.duration,
    streak:    shareData.streak,
    level:     shareData.level,
    intensity: shareData.intensity,
  };

  const previewContainerStyle = {
    width: CARD_W * PREVIEW_SCALE,
    height: CARD_H * PREVIEW_SCALE,
    overflow: 'hidden' as const,
  };

  const previewInnerStyle = {
    width: CARD_W,
    height: CARD_H,
    transform: [
      { scale: PREVIEW_SCALE },
      { translateX: -(CARD_W * (1 - PREVIEW_SCALE) / 2) },
      { translateY: -(CARD_H * (1 - PREVIEW_SCALE) / 2) },
    ],
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Story</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={isBusy}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Template chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={styles.chipsScroll}
          >
            {CHIPS.map(chip => (
              <TouchableOpacity
                key={chip.id}
                style={[styles.chip, template === chip.id && styles.chipActive]}
                onPress={() => handleTemplateChange(chip.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, template === chip.id && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Card preview */}
            <View style={[previewContainerStyle, styles.previewShadow]}>
              {template === 'overlay' ? (
                // Overlay preview: dark gradient placeholder behind, overlay on top
                <View style={previewInnerStyle}>
                  <LinearGradient
                    colors={['#1a1c28', '#0d0f0d']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                  />
                  <View ref={overlayRef} collapsable={false} style={StyleSheet.absoluteFill}>
                    <OverlayCard {...overlayProps} />
                  </View>
                </View>
              ) : (
                <View style={[previewInnerStyle]} ref={cardRef} collapsable={false}>
                  {template === 'pr'      && <PRCard {...prProps} />}
                  {template === 'session' && <SessionIdentityCard {...sessionProps} />}
                </View>
              )}
            </View>

            {/* Overlay tip */}
            {template === 'overlay' && (
              <View style={styles.overlayTip}>
                <Text style={styles.overlayTipText}>
                  💡 Tip: This overlays on your Instagram Story photo/video
                </Text>
              </View>
            )}

            {/* Caption editor */}
            <View style={styles.captionSection}>
              <Text style={styles.captionLabel}>CAPTION</Text>
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
                placeholder="Add a caption…"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
              />
              <Text style={styles.captionCount}>{caption.length}/200</Text>
            </View>
          </ScrollView>

          {/* CTAs */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryBtnWrapper}
              onPress={handleShare}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryContainer]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {shareState === 'capturing' || shareState === 'sharing' ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Share to Instagram Story</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleSave}
              disabled={isBusy}
              activeOpacity={0.75}
            >
              {shareState === 'saving' ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.secondaryBtnText}>Save to Photos</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    color: colors.text,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },

  // Template chips
  chipsScroll: { flexGrow: 0 },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  chipActive: {
    backgroundColor: `${colors.primary}22`,
    borderWidth: 1,
    borderColor: `${colors.primary}60`,
  },
  chipText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
    alignItems: 'center',
  },

  // Preview
  previewShadow: {
    borderRadius: radii.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
    overflow: 'hidden',
  },

  // Overlay tip
  overlayTip: {
    backgroundColor: `${colors.tertiary}12`,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  overlayTipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.tertiary,
    textAlign: 'center',
  },

  // Caption
  captionSection: { width: '100%', gap: spacing.sm },
  captionLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  captionInput: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    padding: spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  captionCount: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  primaryBtnWrapper: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  primaryBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
