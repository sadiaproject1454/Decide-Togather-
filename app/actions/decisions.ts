'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { requireUser } from '@/app/lib/auth';
import type { DecisionStatus } from '@/app/lib/types';

export interface DecisionActionState {
  error?: string;
  success?: string;
}

const VALID_STATUSES: DecisionStatus[] = ['open', 'voting', 'closed'];

function validateDecisionInputs(
  titleRaw: FormDataEntryValue | null,
  descriptionRaw: FormDataEntryValue | null,
  statusRaw: FormDataEntryValue | null,
  deadlineRaw: FormDataEntryValue | null,
  optionLabelsRaw: string[]
) {
  const title = String(titleRaw ?? '').trim();
  const description = String(descriptionRaw ?? '').trim();
  const statusInput = String(statusRaw ?? 'open').trim() as DecisionStatus;
  const deadlineText = String(deadlineRaw ?? '').trim();

  if (!title || title.length < 3) {
    return { error: 'Decision title must be at least 3 characters.' } as const;
  }
  if (title.length > 120) {
    return { error: 'Decision title must be 120 characters or fewer.' } as const;
  }
  if (description.length > 2000) {
    return { error: 'Description must be 2000 characters or fewer.' } as const;
  }

  const status: DecisionStatus = VALID_STATUSES.includes(statusInput) ? statusInput : 'open';

  let deadline: string | null = null;
  if (deadlineText) {
    const parsedDate = new Date(deadlineText);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: 'Please provide a valid deadline date.' } as const;
    }
    deadline = parsedDate.toISOString();
  }

  const cleanedOptions = optionLabelsRaw.map((o) => o.trim()).filter(Boolean);
  if (cleanedOptions.length < 2) {
    return { error: 'Please provide at least 2 non-empty options.' } as const;
  }
  if (cleanedOptions.length > 8) {
    return { error: 'You can add up to 8 options per decision.' } as const;
  }
  if (cleanedOptions.some((label) => label.length > 120)) {
    return { error: 'Each option must be 120 characters or fewer.' } as const;
  }

  const lowerSet = new Set(cleanedOptions.map((o) => o.toLowerCase()));
  if (lowerSet.size !== cleanedOptions.length) {
    return { error: 'Option labels must be unique.' } as const;
  }

  return { title, description, status, deadline, cleanedOptions } as const;
}

export async function createDecisionAction(
  _prevState: DecisionActionState | undefined,
  formData: FormData
): Promise<DecisionActionState> {
  const user = await requireUser();

  const workspaceId = Number(formData.get('workspaceId'));
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    return { error: 'Please select a valid workspace.' };
  }

  const optionLabels = formData.getAll('options').map((o) => String(o));
  const parsed = validateDecisionInputs(
    formData.get('title'),
    formData.get('description'),
    formData.get('status'),
    formData.get('deadline'),
    optionLabels
  );

  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      title: parsed.title,
      description: parsed.description,
      status: parsed.status,
      deadline: parsed.deadline,
    })
    .select('id')
    .single();

  if (decisionError || !decision) {
    return {
      error:
        decisionError?.message ??
        'Could not create decision. Make sure you belong to this workspace.',
    };
  }

  const optionRows = parsed.cleanedOptions.map((label) => ({
    decision_id: decision.id,
    label,
  }));

  const { error: optionsError } = await supabase
    .from('decision_options')
    .insert(optionRows);

  if (optionsError) {
    // Roll back orphan decision if inserting options failed
    await supabase.from('decisions').delete().eq('id', decision.id);
    return { error: optionsError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/decisions');
  revalidatePath('/workspaces');
  revalidatePath(`/workspaces/${workspaceId}`);
  redirect(`/decisions/${decision.id}`);
}

export async function updateDecisionAction(
  _prevState: DecisionActionState | undefined,
  formData: FormData
): Promise<DecisionActionState> {
  await requireUser();

  const decisionId = Number(formData.get('decisionId'));
  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return { error: 'Invalid decision ID.' };
  }

  const rawOptionIds = formData.getAll('optionIds').map((v) => String(v).trim());
  const rawOptionLabels = formData.getAll('optionLabels').map((v) => String(v));

  const pairedOptions: { id: number | null; label: string }[] = [];
  for (let i = 0; i < rawOptionLabels.length; i++) {
    const label = rawOptionLabels[i].trim();
    if (!label) continue;
    const parsedId = Number(rawOptionIds[i]);
    pairedOptions.push({
      id: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null,
      label,
    });
  }

  const parsed = validateDecisionInputs(
    formData.get('title'),
    formData.get('description'),
    formData.get('status'),
    formData.get('deadline'),
    pairedOptions.map((o) => o.label)
  );

  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  // Update the decision row (RLS ensures only creator or workspace admin can update)
  const { data: updatedDecision, error: updateError } = await supabase
    .from('decisions')
    .update({
      title: parsed.title,
      description: parsed.description,
      status: parsed.status,
      deadline: parsed.deadline,
    })
    .eq('id', decisionId)
    .select('id, workspace_id')
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }
  if (!updatedDecision) {
    return { error: 'Decision not found or you do not have permission to edit it.' };
  }

  // Sync decision_options: delete removed, update modified, insert new
  const { data: existingOptions, error: fetchOptErr } = await supabase
    .from('decision_options')
    .select('id, label')
    .eq('decision_id', decisionId);

  if (fetchOptErr) {
    return { error: fetchOptErr.message };
  }

  const existingById = new Map((existingOptions ?? []).map((o) => [o.id, o.label]));
  const keptIds = new Set(
    pairedOptions.map((o) => o.id).filter((id): id is number => id !== null && existingById.has(id))
  );

  const idsToDelete = [...existingById.keys()].filter((id) => !keptIds.has(id));
  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('decision_options')
      .delete()
      .in('id', idsToDelete)
      .eq('decision_id', decisionId);
    if (delErr) {
      return { error: delErr.message };
    }
  }

  for (const opt of pairedOptions) {
    if (opt.id !== null && existingById.has(opt.id)) {
      if (existingById.get(opt.id) !== opt.label) {
        const { error: updOptErr } = await supabase
          .from('decision_options')
          .update({ label: opt.label })
          .eq('id', opt.id)
          .eq('decision_id', decisionId);
        if (updOptErr) {
          return { error: updOptErr.message };
        }
      }
    }
  }

  const toInsert = pairedOptions
    .filter((opt) => opt.id === null || !existingById.has(opt.id))
    .map((opt) => ({
      decision_id: decisionId,
      label: opt.label,
    }));

  if (toInsert.length > 0) {
    const { error: insErr } = await supabase
      .from('decision_options')
      .insert(toInsert);
    if (insErr) {
      return { error: insErr.message };
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/decisions');
  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath(`/workspaces/${updatedDecision.workspace_id}`);

  return { success: 'Decision updated successfully.' };
}

export async function deleteDecisionAction(
  _prevState: DecisionActionState | undefined,
  formData: FormData
): Promise<DecisionActionState> {
  await requireUser();

  const decisionId = Number(formData.get('decisionId'));
  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return { error: 'Invalid decision ID.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('decisions')
    .delete()
    .eq('id', decisionId)
    .select('id, workspace_id')
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: 'Decision not found or you do not have permission to delete it.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/decisions');
  revalidatePath('/workspaces');
  revalidatePath(`/workspaces/${data.workspace_id}`);

  redirect(`/workspaces/${data.workspace_id}?decisionDeleted=1`);
}
