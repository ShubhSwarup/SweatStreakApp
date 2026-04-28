import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking, Platform } from 'react-native';
import { log } from './logger';

export async function captureCard(viewRef: React.RefObject<any>): Promise<string> {
  return captureRef(viewRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
}

export async function shareToInstagram(imageUri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
    return;
  }

  // On iOS, try the Instagram Stories native URL scheme first.
  // This opens Instagram directly into the story composer with the image as the background asset.
  // NOTE: In Expo Go this may not work due to sandbox restrictions — falls back to generic share sheet.
  // TODO (Phase 12C): In a production build, use Instagram's documented background-image pasteboard API.
  if (Platform.OS === 'ios') {
    try {
      const canOpen = await Linking.canOpenURL('instagram-stories://share');
      if (canOpen) {
        await Linking.openURL(`instagram-stories://share?backgroundImage=${encodeURIComponent(imageUri)}`);
        return;
      }
    } catch (err) {
      log.warn('shareWorkout', 'Instagram Stories scheme failed, falling back:', err);
    }
  }

  // Generic share sheet — Instagram, Messages, etc. appear as options
  await Sharing.shareAsync(imageUri, {
    mimeType: 'image/png',
    dialogTitle: 'Share to Instagram Stories',
    UTI: 'public.png',
  });
}

export async function saveToLibrary(imageUri: string): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission required',
      'Allow photo access in Settings to save your card.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }

  try {
    await MediaLibrary.saveToLibraryAsync(imageUri);
    return true;
  } catch (err) {
    log.error('shareWorkout', 'saveToLibrary failed:', err);
    Alert.alert('Save failed', 'Could not save image to your photo library.');
    return false;
  }
}
