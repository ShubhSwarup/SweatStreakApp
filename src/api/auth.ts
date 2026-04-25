import client from './client';
import type { AuthResponse, RefreshResponse } from '../types/api';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/api/auth/register', { name, email, password });
  return data;
}

export async function refreshToken(refreshToken: string): Promise<RefreshResponse> {
  const { data } = await client.post<RefreshResponse>('/api/auth/refresh-token', { refreshToken });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await client.post('/api/auth/logout', { refreshToken });
}
