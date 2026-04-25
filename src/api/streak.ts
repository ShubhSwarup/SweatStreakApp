import client from './client';
export async function getStreak() {
  const { data } = await client.get('/api/streak');
  return data;
}
