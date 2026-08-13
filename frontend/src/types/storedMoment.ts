// Mirrors the "moments" table defined in supabase/schema.sql
export type StoredMoment = {
  id: string;
  user_id: string;
  photo_url: string;
  city: string | null;
  country: string | null;
  temperature: number | null;
  condition: string | null;
  local_time: string | null;
  btc_price_usd: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};
