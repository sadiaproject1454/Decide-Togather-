'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';

export interface AuthActionState {
  error?: string;
  success?: string;
}

export async function loginAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = String(formData.get('next') ?? '/dashboard');

  if (!email || !password) {
    return { error: 'Please enter both your email and password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');

  // Prevent open-redirect: only allow safe internal paths
  const safeRedirect =
    nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard';
  redirect(safeRedirect);
}

export async function signupAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!fullName || fullName.length < 2) {
    return { error: 'Please enter your full name (at least 2 characters).' };
  }
  if (!email) {
    return { error: 'Please enter a valid email address.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  const headerList = await headers();
  const origin = headerList.get('origin') ?? 'http://localhost:3000';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is disabled, Supabase immediately returns a session.
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/dashboard');
  }

  // Otherwise, prompt the user to confirm their email address.
  redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
