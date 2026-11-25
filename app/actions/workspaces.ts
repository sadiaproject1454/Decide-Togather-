'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { requireUser } from '@/app/lib/auth';

export interface WorkspaceActionState {
  error?: string;
}

export async function createWorkspaceAction(
  _prevState: WorkspaceActionState | undefined,
  formData: FormData
): Promise<WorkspaceActionState> {
  const user = await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!name || name.length < 2) {
    return { error: 'Workspace name must be at least 2 characters.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name,
      description,
      owner_id: user.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { error: error?.message ?? 'Could not create workspace.' };
  }

  revalidatePath('/dashboard');
  redirect(`/workspaces/${data.id}`);
}
