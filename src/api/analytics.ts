import client from './client';

export async function getWeeklyAnalytics(): Promise<Record<string, { volume: number; workouts: number }>> {
  const { data } = await client.get('/api/analytics/weekly');
  return data.data ?? {};
}
