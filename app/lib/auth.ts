import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import type { UserProfile } from '@/app/lib/types';

export interface CurrentUserContext {
  id: string;
  email: string;
  profile: UserProfile;
}

/**
 * Reads the verified user from Supabase Auth (via getUser, NOT getSession)
 * and loads their profile from the public.users PostgreSQL table.
 */
export async function getCurrentUser(): Promise<CurrentUserContext | null> {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Load profile from public.users
  const { data: existingProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    return {
      id: user.id,
      email: user.email ?? existingProfile.email,
      profile: existingProfile,
    };
  }

  // Fallback: create profile row if missing
  const fallbackName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : '';

  const { data: insertedProfile } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email ?? '',
      full_name: fallbackName,
    })
    .select('*')
    .single();

  const profile: UserProfile = insertedProfile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: fallbackName,
    avatar_url: null,
    bio: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    id: user.id,
    email: user.email ?? profile.email,
    profile,
  };
}

/**
 * Protects Server Components and Server Actions.
 * Redirects unauthenticated visitors to /login.
 */
export async function requireUser(): Promise<CurrentUserContext> {
  const current = await getCurrentUser();
  if (!current) {
    redirect('/login');
  }
  return current;
}
