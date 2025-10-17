import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  // Singleton pattern - solo crear una instancia
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false, // No necesitamos persistir sesión para este caso de uso
          autoRefreshToken: false,
        }
      }
    );
  }
  
  return supabaseInstance;
}
