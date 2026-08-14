import { decode } from 'base64-arraybuffer';
import { File } from 'expo-file-system';

import { supabase } from '../lib/supabase';
import { Moment } from '../types/moment';
import { StoredMoment } from '../types/storedMoment';

type NewMoment = Moment & {
  photoUri: string;
  latitude: number;
  longitude: number;
};

// Uploads the photo to Supabase Storage and creates the Moment row that
// points at it, all scoped to whoever's currently logged in.
export async function postMoment(userId: string, moment: NewMoment): Promise<void> {
  console.log('[post] reading photo as base64...');
  const file = new File(moment.photoUri);
  const base64 = await file.base64();

  // Storage's upload() wants actual binary data, not a base64 string -
  // this decodes it into that.
  const fileData = decode(base64);

  // Uploading into "<userId>/<filename>" matches the storage policy in
  // supabase/schema.sql, which only allows uploads into your own folder.
  const path = `${userId}/${Date.now()}.jpg`;
  console.log('[post] uploading to storage at', path);
  const { error: uploadError } = await supabase.storage
    .from('moments')
    .upload(path, fileData, { contentType: 'image/jpeg' });

  if (uploadError) {
    console.log('[post] upload error', uploadError.message);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage.from('moments').getPublicUrl(path);
  console.log('[post] uploaded, public url:', urlData.publicUrl);

  console.log('[post] inserting moment row...');
  const { error: insertError } = await supabase.from('moments').insert({
    user_id: userId,
    photo_url: urlData.publicUrl,
    photo_path: path,
    city: moment.city,
    country: moment.country,
    temperature: moment.temperature,
    condition: moment.condition,
    local_time: moment.localTime,
    btc_price_usd: moment.btcPriceUsd,
    latitude: moment.latitude,
    longitude: moment.longitude,
  });

  if (insertError) {
    console.log('[post] insert error', insertError.message);
    throw insertError;
  }

  console.log('[post] done');
}

export async function deleteMoment(moment: StoredMoment): Promise<void> {
  // delete the photo file first - if this fails we still have a valid
  // row pointing at a real file, rather than a row pointing at nothing
  if (moment.photo_path) {
    console.log('[delete] removing photo at', moment.photo_path);
    const { error: storageError } = await supabase.storage
      .from('moments')
      .remove([moment.photo_path]);

    if (storageError) {
      console.log('[delete] storage error', storageError.message);
      throw storageError;
    }
  }

  console.log('[delete] removing moment row', moment.id);
  const { error: deleteError } = await supabase.from('moments').delete().eq('id', moment.id);

  if (deleteError) {
    console.log('[delete] row delete error', deleteError.message);
    throw deleteError;
  }

  console.log('[delete] done');
}

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
