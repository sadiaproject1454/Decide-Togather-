'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { requireUser } from '@/app/lib/auth';

export interface DecisionActionState {
  error?: string;
}

export async function createDecisionAction(
  _prevState: DecisionActionState | undefined,
  formData: FormData
): Promise<DecisionActionState> {
  const user = await requireUser();

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const workspaceIdRaw = Number(formData.get('workspaceId'));
  const deadlineRaw = String(formData.get('deadline') ?? '').trim();
  const rawOptions = formData.getAll('options').map((o) => String(o).trim()).filter(Boolean);

  if (!title || title.length < 3) {
    return { error: 'Decision title must be at least 3 characters.' };
  }
  if (!Number.isFinite(workspaceIdRaw) || workspaceIdRaw <= 0) {
    return { error: 'Please select a valid workspace.' };
  }
  if (rawOptions.length < 2) {
    return { error: 'Please add at least 2 options.' };
  }

  const supabase = await createClient();

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      workspace_id: workspaceIdRaw,
      created_by: user.id,
      title,
      description,
      status: 'voting',
      deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
    })
    .select('id')
    .single();

  if (decisionError || !decision) {
    return { error: decisionError?.message ?? 'Could not create decision.' };
  }

  const optionRows = rawOptions.map((label) => ({
    decision_id: decision.id,
    label,
  }));

  const { error: optionsError } = await supabase
    .from('decision_options')
    .insert(optionRows);

  if (optionsError) {
    return { error: optionsError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/decisions');
  revalidatePath(`/workspaces/${workspaceIdRaw}`);
  redirect(`/decisions/${decision.id}`);
}

export async function voteOptionAction(optionId: number, decisionId: number) {
  await requireUser();
  const supabase = await createClient();

  const { data: newVotes, error } = await supabase.rpc('increment_option_vote', {
    p_option_id: optionId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath('/decisions');
  revalidatePath('/dashboard');

  return { votes: newVotes };
}
