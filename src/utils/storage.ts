import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getItem(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  return AsyncStorage.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  return AsyncStorage.removeItem(key);
}

export async function multiGet(keys: string[]): Promise<Record<string, string | null>> {
  const pairs = await AsyncStorage.multiGet(keys);
  return Object.fromEntries(pairs.map(([k, v]) => [k, v]));
}

export async function multiSet(pairs: Record<string, string>): Promise<void> {
  return AsyncStorage.multiSet(Object.entries(pairs));
}

export async function multiRemove(keys: string[]): Promise<void> {
  return AsyncStorage.multiRemove(keys);
}
