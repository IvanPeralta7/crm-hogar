import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isValidSupabaseKey, readEnv } from './env';

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    isValidSupabaseKey(supabaseAnonKey),
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  return supabase;
}

export function getSupabaseConfigError(): string | null {
  if (supabase) return null;

  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!rawUrl || !rawKey) {
    return 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.';
  }

  for (const char of String(rawUrl) + String(rawKey)) {
    if (char.charCodeAt(0) > 255) {
      return 'Las credenciales de Supabase tienen caracteres invalidos. Volvé a copiarlas desde el dashboard sin comillas ni espacios extra.';
    }
  }

  if (rawKey && !isValidSupabaseKey(String(rawKey).trim())) {
    return 'La clave de Supabase no es valida. Usá la anon public (eyJ...) o publishable (sb_publishable_...) desde Project Settings → API.';
  }

  return 'No se pudo configurar Supabase. Revisá las variables de entorno.';
}
