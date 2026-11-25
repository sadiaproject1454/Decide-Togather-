import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import type { Database } from './database.types';

/**
 * Server Supabase client — used inside Server Components, Server Actions,
 * and Route Handlers. Reads and writes auth session cookies per request.
 */
export async function createClient() {
  // Defer to request-time dynamic rendering before Supabase's auth client
  // touches Date.now() during Next.js 16 Cache Components / Partial Prefetching.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from a Server Component where headers cannot be modified.
            // proxy.ts handles refreshing and persisting cookies on every request.
          }
        },
      },
    }
  );
}
