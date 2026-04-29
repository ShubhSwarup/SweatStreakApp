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

export async function shareToInstagram(imageUri: string): Promise<ShareToInstagramResult> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new ShareWorkoutError('SHARING_UNAVAILABLE', 'Sharing is not available on this device.');
  }

  const openedInstagram = await tryOpenInstagram();
  if (openedInstagram) {
    return 'shared';
  }

  try {
    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/png',
      dialogTitle: 'Share to Instagram Stories',
      UTI: 'public.png',
    });
    return 'sharedViaSheet';
  } catch (err) {
    log.warn('shareWorkout', 'shareAsync failed, trying save fallback:', err);
  }

  try {
    await saveToLibrary(imageUri);
    return 'savedFallback';
  } catch (err) {
    log.error('shareWorkout', 'shareToInstagram fallback failed:', err);
    throw new ShareWorkoutError('SHARE_FAILED', 'Could not share image to Instagram.');
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

async function tryOpenInstagram(): Promise<boolean> {
  const candidates =
    Platform.OS === 'ios'
      ? ['instagram-stories://share', 'instagram://camera', 'instagram://app']
      : ['instagram://story-camera', 'instagram://camera', 'instagram://app'];

  for (const url of candidates) {
    try {
      await Linking.openURL(url);
      return true;
    } catch (err) {
      log.warn('shareWorkout', `Failed to open ${url}:`, err);
    }
  }

  return false;
}
