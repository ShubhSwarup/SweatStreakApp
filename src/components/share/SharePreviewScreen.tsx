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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import PRCard, { CARD_W, CARD_H, type PRCardProps } from './PRCard';
import SessionIdentityCard, { type SessionIdentityCardProps } from './SessionIdentityCard';
import OverlayCard, { type OverlayCardProps } from './OverlayCard';
import Toast from '../common/Toast';
import {
  captureCard,
  saveToLibrary,
  shareToInstagram,
  ShareWorkoutError,
} from '../../utils/shareWorkout';
import { generateCaption } from '../../utils/generateCaption';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { log } from '../../utils/logger';
import type { CaptionMode, ShareData, ShareTemplate } from './shareTypes';

interface Props {
  visible: boolean;
  onClose: () => void;
  onShareSuccess?: () => void;
  shareData: ShareData;
  defaultTemplate: ShareTemplate;
}

const TEMPLATE_CHIPS: { id: ShareTemplate; label: string }[] = [
  { id: 'overlay', label: 'Overlay' },
  { id: 'pr', label: 'PR Card' },
  { id: 'session', label: 'Session Card' },
];

const CAPTION_MODE_CHIPS: { id: CaptionMode; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'funny', label: 'Funny' },
];

const SCREEN_W = Dimensions.get('window').width;
const PREVIEW_SCALE = Math.min(1, (SCREEN_W - spacing.lg * 2) / CARD_W);

type ShareState = 'idle' | 'capturing' | 'sharing' | 'saving' | 'success';
type ToastVariant = 'info' | 'success' | 'error';
type ToastState = { message: string; variant: ToastVariant } | null;

export default function SharePreviewScreen({
  visible,
  onClose,
  onShareSuccess,
  shareData,
  defaultTemplate,
}: Props) {
  const cardRef = useRef<View>(null);
  const overlayRef = useRef<View>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [template, setTemplate] = useState<ShareTemplate>(defaultTemplate);
  const [captionMode, setCaptionMode] = useState<CaptionMode>('minimal');
  const [caption, setCaption] = useState(() => generateCaption(defaultTemplate, shareData, 'minimal'));
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [showBranding, setShowBranding] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  const previewOpacity = useSharedValue(0);
  const previewScale = useSharedValue(0.9);
  const captionOpacity = useSharedValue(0);
  const captionTranslateY = useSharedValue(18);
  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(24);

  const isBusy = shareState !== 'idle';

  React.useEffect(() => {
    if (!visible) {
      clearPendingClose();
      setShareState('idle');
      setToast(null);
      return;
    }

    setTemplate(defaultTemplate);
    setCaptionMode('minimal');
    setCaption(generateCaption(defaultTemplate, shareData, 'minimal'));
    setShowBranding(true);
    setShareState('idle');
    setToast(null);

    previewOpacity.value = 0;
    previewScale.value = 0.9;
    captionOpacity.value = 0;
    captionTranslateY.value = 18;
    footerOpacity.value = 0;
    footerTranslateY.value = 24;

    previewOpacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    previewScale.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    captionOpacity.value = withDelay(
      50,
      withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }),
    );
    captionTranslateY.value = withDelay(
      50,
      withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }),
    );
    footerOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );
    footerTranslateY.value = withDelay(
      100,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );

    return () => clearPendingClose();
  }, [
    captionOpacity,
    captionTranslateY,
    defaultTemplate,
    footerOpacity,
    footerTranslateY,
    previewOpacity,
    previewScale,
    shareData,
    visible,
  ]);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  const previewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
    transform: [{ scale: previewScale.value }],
  }));

  const captionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: captionOpacity.value,
    transform: [{ translateY: captionTranslateY.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

  const handleTemplateChange = (nextTemplate: ShareTemplate) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTemplate(nextTemplate);
    setCaption(generateCaption(nextTemplate, shareData, captionMode));
  };

  const handleCaptionModeChange = (mode: CaptionMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCaptionMode(mode);
    setCaption(generateCaption(template, shareData, mode));
  };

  const handleBrandingToggle = (value: boolean) => {
    setShowBranding(value);
  };

  const getActiveRef = () => (template === 'overlay' ? overlayRef : cardRef);

  const showToastMessage = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
  };

  const clearPendingClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleShare = async () => {
    if (isBusy) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShareState('capturing');

    try {
      const uri = await captureCard(getActiveRef());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setShareState('sharing');
      const result = await shareToInstagram(uri);

      if (result === 'savedFallback') {
        setShareState('idle');
        showToastMessage('Instagram not found. Image saved to Photos instead.', 'info');
        return;
      }

      setShareState('success');
      clearPendingClose();
      closeTimerRef.current = setTimeout(() => {
        onShareSuccess?.();
        onClose();
        setShareState('idle');
      }, 1000);
    } catch (err) {
      log.error('SharePreviewScreen', 'share failed:', err);
      setShareState('idle');
      showToastMessage(getShareErrorMessage(err), 'error');
    }
  };

  const handleSave = async () => {
    if (isBusy) return;

    setShareState('capturing');
    try {
      const uri = await captureCard(getActiveRef());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setShareState('saving');
      await saveToLibrary(uri);
      setShareState('idle');
      showToastMessage('Saved to Photos.', 'success');
    } catch (err) {
      log.error('SharePreviewScreen', 'save failed:', err);
      setShareState('idle');
      showToastMessage(getShareErrorMessage(err), 'error');
    }
  };

  const prProps: PRCardProps = {
    exercise: shareData.prExercise,
    prType: shareData.prType,
    newValue: shareData.prNewValue,
    newReps: shareData.prNewReps,
    oldValue: shareData.prOldValue,
    volume: shareData.volume,
    sets: shareData.sets,
    duration: shareData.duration,
    streak: shareData.streak,
    intensity: shareData.intensity,
    date: shareData.date,
    showBranding,
  };

  const sessionProps: SessionIdentityCardProps = {
    workoutName: shareData.workoutName,
    volume: shareData.volume,
    duration: shareData.duration,
    sets: shareData.sets,
    muscleGroup: shareData.muscleGroup,
    intensity: shareData.intensity,
    streak: shareData.streak,
    level: shareData.level,
    percentile: shareData.percentile,
    date: shareData.date,
    showBranding,
  };

  const overlayProps: OverlayCardProps = {
    exercise: shareData.prExercise,
    weight: shareData.prNewValue,
    reps: shareData.prNewReps,
    prBadge:
      shareData.prOldValue != null
        ? `+${+(shareData.prNewValue - shareData.prOldValue).toFixed(1)} KG`
        : undefined,
    volume: shareData.volume,
    sets: shareData.sets,
    duration: shareData.duration,
    streak: shareData.streak,
    level: shareData.level,
    intensity: shareData.intensity,
    showBranding,
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
      { translateX: -((CARD_W * (1 - PREVIEW_SCALE)) / 2) },
      { translateY: -((CARD_H * (1 - PREVIEW_SCALE)) / 2) },
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={styles.chipsScroll}
          >
            {TEMPLATE_CHIPS.map((chip) => (
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
            <Animated.View style={[previewContainerStyle, styles.previewShadow, previewAnimatedStyle]}>
              {template === 'overlay' ? (
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
                <View style={previewInnerStyle} ref={cardRef} collapsable={false}>
                  {template === 'pr' && <PRCard {...prProps} />}
                  {template === 'session' && <SessionIdentityCard {...sessionProps} />}
                </View>
              )}
            </Animated.View>

            {template === 'overlay' && (
              <View style={styles.overlayTip}>
                <Text style={styles.overlayTipText}>
                  Tip: This overlays on your Instagram Story photo or video.
                </Text>
              </View>
            )}

            <Animated.View style={[styles.captionSection, captionAnimatedStyle]}>
              <Text style={styles.captionLabel}>CAPTION</Text>
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
                placeholder="Add a caption..."
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
              />
              <Text style={styles.captionCount}>{caption.length}/200</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.captionModesRow}
              >
                {CAPTION_MODE_CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.chip, captionMode === chip.id && styles.chipActive]}
                    onPress={() => handleCaptionModeChange(chip.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, captionMode === chip.id && styles.chipTextActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.brandingRow}>
                <View style={styles.brandingTextWrap}>
                  <Text style={styles.brandingTitle}>Include SweatStreak logo</Text>
                  <Text style={styles.brandingHint}>Keeps the card branded and authentic.</Text>
                </View>
                <Switch
                  value={showBranding}
                  onValueChange={handleBrandingToggle}
                  trackColor={{
                    false: colors.surfaceContainerHighest,
                    true: `${colors.primary}55`,
                  }}
                  thumbColor={showBranding ? colors.primary : colors.textSecondary}
                />
              </View>
            </Animated.View>
          </ScrollView>

          <Animated.View style={[styles.footer, footerAnimatedStyle]}>
            <TouchableOpacity
              style={[styles.primaryBtnWrapper, isBusy && styles.btnDisabled]}
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
                ) : shareState === 'success' ? (
                  <Text style={styles.primaryBtnText}>✓ Shared!</Text>
                ) : (
                  <Text style={styles.primaryBtnText}>Share to Instagram Story</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, isBusy && styles.btnDisabled]}
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
          </Animated.View>
        </KeyboardAvoidingView>

        <Toast visible={!!toast} message={toast?.message ?? ''} variant={toast?.variant ?? 'info'} />
      </SafeAreaView>
    </Modal>
  );
}

function getShareErrorMessage(error: unknown): string {
  if (error instanceof ShareWorkoutError) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        return 'Allow photo access in Settings to save images';
      case 'CAPTURE_FAILED':
        return 'Something went wrong. Please try again.';
      case 'SHARE_FAILED':
      case 'SHARING_UNAVAILABLE':
      case 'SAVE_FAILED':
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  return 'Something went wrong. Please try again.';
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
  previewShadow: {
    borderRadius: radii.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
    overflow: 'hidden',
  },
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
  captionSection: {
    width: '100%',
    gap: spacing.sm,
  },
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
  captionModesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: 2,
  },
  brandingRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerHigh,
  },
  brandingTextWrap: {
    flex: 1,
    gap: 2,
  },
  brandingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.text,
  },
  brandingHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
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
  btnDisabled: {
    opacity: 0.72,
  },
});
