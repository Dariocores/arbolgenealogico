import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * La app funciona en dos modos:
 * - Nube (si están definidas VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY): login
 *   y datos en el servidor, con licencia controlada por el administrador.
 * - Local (si faltan): se usa localStorage, como hasta ahora.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
