import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Linking, Platform } from 'react-native';
import { log } from './logger';

export type ShareWorkoutErrorCode =
  | 'CAPTURE_FAILED'
  | 'PERMISSION_DENIED'
  | 'SHARING_UNAVAILABLE'
  | 'SAVE_FAILED'
  | 'SHARE_FAILED';

export class ShareWorkoutError extends Error {
  code: ShareWorkoutErrorCode;

  constructor(code: ShareWorkoutErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ShareWorkoutError';
  }
}

export type ShareToInstagramResult = 'shared' | 'sharedViaSheet' | 'savedFallback';

export async function captureCard(viewRef: React.RefObject<any>): Promise<string> {
  try {
    return await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
  } catch (err) {
    log.error('shareWorkout', 'captureCard failed:', err);
    throw new ShareWorkoutError('CAPTURE_FAILED', 'Could not capture the share card.');
  }
}

export async function shareToInstagram(
  imageUri: string,
  isSticker = false,
): Promise<ShareToInstagramResult> {
  if (Platform.OS === 'ios') {
    const sent = await tryIOSInstagramStories(imageUri, isSticker);
    if (sent) return 'shared';
  }

  // Primary path: native system share sheet.
  // On Android this shows the full share menu; Instagram (if installed) is in the list
  // and receives the image file — the user then picks Stories or Feed inside Instagram.
  const available = await Sharing.isAvailableAsync();
  if (available) {
    try {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your workout',
        UTI: 'public.png',
      });
      return 'sharedViaSheet';
    } catch (err) {
      log.warn('shareWorkout', 'shareAsync failed, falling back to save:', err);
    }
  }

  // Last resort: save to the photo library.
  try {
    await saveToLibrary(imageUri);
    return 'savedFallback';
  } catch (err) {
    log.error('shareWorkout', 'all share methods failed:', err);
    throw new ShareWorkoutError('SHARE_FAILED', 'Could not share the image.');
  }
}

export async function saveToLibrary(imageUri: string): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new ShareWorkoutError(
      'PERMISSION_DENIED',
      'Allow photo access in Settings to save your card.',
    );
  }

  try {
    await MediaLibrary.saveToLibraryAsync(imageUri);
    return true;
  } catch (err) {
    log.error('shareWorkout', 'saveToLibrary failed:', err);
    throw new ShareWorkoutError('SAVE_FAILED', 'Could not save image to your photo library.');
  }
}

async function tryIOSInstagramStories(imageUri: string, isSticker: boolean): Promise<boolean> {
  const scheme = 'instagram-stories://share';
  try {
    const canOpen = await Linking.canOpenURL(scheme);
    if (!canOpen) return false;
    const imageParam = isSticker
      ? `stickerImageURL=${encodeURIComponent(imageUri)}`
      : `backgroundImageURL=${encodeURIComponent(imageUri)}`;
    const url = `${scheme}?source_application=com.sweatstreak.app&${imageParam}`;
    await Linking.openURL(url);
    return true;
  } catch (err) {
    log.warn('shareWorkout', 'iOS Instagram Stories scheme failed:', err);
    return false;
  }
}
