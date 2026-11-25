'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { requireUser } from '@/app/lib/auth';

export interface ProfileActionState {
  error?: string;
  success?: string;
}

export async function updateProfileAction(
  _prevState: ProfileActionState | undefined,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireUser();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const avatarUrlRaw = String(formData.get('avatarUrl') ?? '').trim();

  if (!fullName || fullName.length < 2) {
    return { error: 'Full name must be at least 2 characters.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      bio,
      avatar_url: avatarUrlRaw || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/profile');
  revalidatePath('/dashboard');

  return { success: 'Profile updated successfully.' };
}
