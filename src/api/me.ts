import client from './client';
import type { User } from '../types/api';

export async function getProfile(): Promise<User> {
  const { data } = await client.get<{ user: User }>('/api/user/profile');
  return data.user;
}

export async function updateSettings(settings: {
  weightUnit?: 'kg' | 'lbs';
  notificationsEnabled?: boolean;
  restTimerDefault?: number;
}): Promise<void> {
  await client.patch('/api/user/settings', settings);
}

export async function deleteAccount(): Promise<void> {
  await client.delete('/api/user/account');
}
