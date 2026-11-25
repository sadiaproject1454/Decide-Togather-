import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Browser Supabase client — used inside Client Components ('use client').
 * Only uses the public URL and publishable key (never any secret key).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
