import { supabase } from '../lib/supabase';
import { StoredMoment } from '../types/storedMoment';

export async function fetchRecentMoments(limit = 10): Promise<StoredMoment[]> {
  console.log('[moments] fetching recent moments...');

  // No "where user_id = ..." needed here - the RLS policy on the moments
  // table (see supabase/schema.sql) already guarantees Postgres only ever
  // returns rows belonging to whoever's currently logged in. The database
  // enforces it, not this query.
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.log('[moments] fetch error', error.message);
    throw error;
  }

  console.log('[moments] got', data.length, 'moments');
  return data;
}
