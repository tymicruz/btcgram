import { Moment } from '../types/moment';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchMoment(lat: number, lon: number): Promise<Moment> {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set (check .env.local)');
  }

  const url = `${API_BASE_URL}/api/moment?lat=${lat}&lon=${lon}`;
  console.log('[moment] fetching', url);

  const response = await fetch(url);
  console.log('[moment] response status', response.status);

  if (!response.ok) {
    throw new Error(`/api/moment failed with status ${response.status}`);
  }

  const data: Moment = await response.json();
  console.log('[moment] got data', data);
  return data;
}
