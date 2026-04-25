import client from './client';
import type { DashboardData } from '../types/api';

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await client.get('/api/dashboard');
  return (data as { success: boolean; data: DashboardData }).data;
}
