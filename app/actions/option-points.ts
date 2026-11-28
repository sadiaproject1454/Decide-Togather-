'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { requireUser } from '@/app/lib/auth';
import type { OptionPointType } from '@/app/lib/types';

export interface OptionPointActionState {
  error?: string;
  success?: string;
  actionId?: number;
}

function validatePointContent(contentRaw: FormDataEntryValue | null) {
  const content = String(contentRaw ?? '').trim();
  if (!content || content.length < 2) {
    return { error: 'Point content must be at least 2 characters.' } as const;
  }
  if (content.length > 500) {
    return { error: 'Point content must be 500 characters or fewer.' } as const;
  }
  return { content } as const;
}

export async function createOptionPointAction(
  _prevState: OptionPointActionState | undefined,
  formData: FormData
): Promise<OptionPointActionState> {
  const user = await requireUser();

  const decisionId = Number(formData.get('decisionId'));
  const optionId = Number(formData.get('optionId'));
  const workspaceId = Number(formData.get('workspaceId'));
  const rawType = String(formData.get('type') ?? '').trim();

  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return { error: 'Invalid decision ID.' };
  }
  if (!Number.isInteger(optionId) || optionId <= 0) {
    return { error: 'Invalid option ID.' };
  }
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    return { error: 'Invalid workspace ID.' };
  }
  if (rawType !== 'pro' && rawType !== 'con') {
    return { error: 'Point type must be either pro or con.' };
  }
  const type: OptionPointType = rawType;

  const parsed = validatePointContent(formData.get('content'));
  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  // Verify the option belongs to the specified decision and workspace via RLS
  const { data: optionRow, error: optionErr } = await supabase
    .from('decision_options')
    .select('id, decision_id, decisions!inner(id, workspace_id)')
    .eq('id', optionId)
    .eq('decision_id', decisionId)
    .maybeSingle();

  if (optionErr || !optionRow) {
    return {
      error: 'Decision option not found or you do not have access to its workspace.',
    };
  }

  const parentDecision = Array.isArray(optionRow.decisions)
    ? optionRow.decisions[0]
    : optionRow.decisions;

  if (!parentDecision || parentDecision.workspace_id !== workspaceId) {
    return {
      error: 'Option does not belong to a decision in this workspace.',
    };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('decision_option_points')
    .insert({
      decision_id: decisionId,
      decision_option_id: optionId,
      workspace_id: parentDecision.workspace_id,
      type,
      content: parsed.content,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    return {
      error: insertErr?.message ?? 'Could not add point. Please check your permissions.',
    };
  }

  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath(`/workspaces/${parentDecision.workspace_id}`);

  return {
    success: type === 'pro' ? 'Pro added successfully.' : 'Con added successfully.',
    actionId: inserted.id,
  };
}

export async function updateOptionPointAction(
  _prevState: OptionPointActionState | undefined,
  formData: FormData
): Promise<OptionPointActionState> {
  await requireUser();

  const pointId = Number(formData.get('pointId'));
  const decisionId = Number(formData.get('decisionId'));

  if (!Number.isInteger(pointId) || pointId <= 0) {
    return { error: 'Invalid point ID.' };
  }
  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return { error: 'Invalid decision ID.' };
  }

  const parsed = validatePointContent(formData.get('content'));
  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  const { data: updated, error: updateErr } = await supabase
    .from('decision_option_points')
    .update({ content: parsed.content })
    .eq('id', pointId)
    .eq('decision_id', decisionId)
    .select('id, workspace_id, type')
    .maybeSingle();

  if (updateErr) {
    return { error: updateErr.message };
  }
  if (!updated) {
    return { error: 'Item not found or you do not have permission to edit it.' };
  }

  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath(`/workspaces/${updated.workspace_id}`);

  return {
    success: updated.type === 'pro' ? 'Pro updated successfully.' : 'Con updated successfully.',
    actionId: updated.id,
  };
}

export async function deleteOptionPointAction(
  _prevState: OptionPointActionState | undefined,
  formData: FormData
): Promise<OptionPointActionState> {
  await requireUser();

  const pointId = Number(formData.get('pointId'));
  const decisionId = Number(formData.get('decisionId'));

  if (!Number.isInteger(pointId) || pointId <= 0) {
    return { error: 'Invalid point ID.' };
  }
  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return { error: 'Invalid decision ID.' };
  }

  const supabase = await createClient();

  const { data: deleted, error: deleteErr } = await supabase
    .from('decision_option_points')
    .delete()
    .eq('id', pointId)
    .eq('decision_id', decisionId)
    .select('id, workspace_id, type')
    .maybeSingle();

  if (deleteErr) {
    return { error: deleteErr.message };
  }
  if (!deleted) {
    return { error: 'Item not found or you do not have permission to delete it.' };
  }

  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath(`/workspaces/${deleted.workspace_id}`);

  return {
    success: deleted.type === 'pro' ? 'Pro deleted successfully.' : 'Con deleted successfully.',
    actionId: deleted.id,
  };
}
