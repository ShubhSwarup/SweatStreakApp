import client from './client';
export async function getXP() {
  const { data } = await client.get('/api/xp');
  return data;
}
