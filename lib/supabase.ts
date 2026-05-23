import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si no hay variables configuradas, devolvemos null para que la UI
// muestre un aviso amable en vez de petar la app.
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const supabaseReady = Boolean(url && key);
