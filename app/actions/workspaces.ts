'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { requireUser } from '@/app/lib/auth';

export interface WorkspaceActionState {
  error?: string;
  success?: string;
  workspaceId?: number;
}

function validateWorkspaceFields(nameRaw: FormDataEntryValue | null, descriptionRaw: FormDataEntryValue | null) {
  const name = String(nameRaw ?? '').trim();
  const description = String(descriptionRaw ?? '').trim();

  if (!name || name.length < 2) {
    return { error: 'Workspace name must be at least 2 characters.' } as const;
  }
  if (name.length > 80) {
    return { error: 'Workspace name must be 80 characters or fewer.' } as const;
  }
  if (description.length > 500) {
    return { error: 'Description must be 500 characters or fewer.' } as const;
  }

  return { name, description } as const;
}

export async function createWorkspaceAction(
  _prevState: WorkspaceActionState | undefined,
  formData: FormData
): Promise<WorkspaceActionState> {
  const user = await requireUser();
  const parsed = validateWorkspaceFields(formData.get('name'), formData.get('description'));

  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name: parsed.name,
      description: parsed.description,
      owner_id: user.id,
    })
    .select('id, name')
    .single();

  if (error || !data) {
    return { error: error?.message ?? 'Could not create workspace.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/workspaces');
  revalidatePath('/decisions/new');

  return {
    success: `Workspace "${data.name}" created successfully.`,
    workspaceId: data.id,
  };
}

export async function updateWorkspaceAction(
  _prevState: WorkspaceActionState | undefined,
  formData: FormData
): Promise<WorkspaceActionState> {
  await requireUser();

  const workspaceId = Number(formData.get('workspaceId'));
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    return { error: 'Invalid workspace ID.' };
  }

  const parsed = validateWorkspaceFields(formData.get('name'), formData.get('description'));
  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .update({
      name: parsed.name,
      description: parsed.description,
    })
    .eq('id', workspaceId)
    .select('id, name')
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: 'Workspace not found or you do not have permission to edit it.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/workspaces');
  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath('/decisions', 'layout');

  return {
    success: `Workspace "${data.name}" updated successfully.`,
    workspaceId: data.id,
  };
}

export async function deleteWorkspaceAction(
  _prevState: WorkspaceActionState | undefined,
  formData: FormData
): Promise<WorkspaceActionState> {
  const user = await requireUser();

  const workspaceId = Number(formData.get('workspaceId'));
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    return { error: 'Invalid workspace ID.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: 'Workspace not found or only the workspace owner can delete it.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/workspaces');
  revalidatePath('/decisions', 'layout');

  redirect('/workspaces?deleted=1');
}
