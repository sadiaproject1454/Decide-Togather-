'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';
import { requireUser } from '@/app/lib/auth';

export interface EvidenceActionState {
  error?: string;
  success?: string;
  actionId?: number;
}

function validateEvidenceInputs(
  titleRaw: FormDataEntryValue | null,
  descriptionRaw: FormDataEntryValue | null,
  sourceUrlRaw: FormDataEntryValue | null
) {
  const title = String(titleRaw ?? '').trim();
  const descriptionText = String(descriptionRaw ?? '').trim();
  const sourceUrlText = String(sourceUrlRaw ?? '').trim();

  if (!title || title.length < 2) {
    return { error: 'Evidence title must be at least 2 characters.' } as const;
  }
  if (title.length > 200) {
    return { error: 'Evidence title must be 200 characters or fewer.' } as const;
  }
  if (descriptionText.length > 2000) {
    return { error: 'Description must be 2000 characters or fewer.' } as const;
  }

  let sourceUrl: string | null = null;
  if (sourceUrlText) {
    if (sourceUrlText.length > 500) {
      return { error: 'Source URL must be 500 characters or fewer.' } as const;
    }
    try {
      const parsedUrl = new URL(sourceUrlText);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return { error: 'Source URL must start with http:// or https://.' } as const;
      }
      sourceUrl = parsedUrl.toString();
    } catch {
      return { error: 'Please enter a valid URL (e.g. https://example.com/report).' } as const;
    }
  }

  return {
    title,
    description: descriptionText || null,
    sourceUrl,
  } as const;
}

export async function createEvidenceAction(
  _prevState: EvidenceActionState | undefined,
  formData: FormData
): Promise<EvidenceActionState> {
  const user = await requireUser();

  const decisionId = Number(formData.get('decisionId'));
  const workspaceId = Number(formData.get('workspaceId'));

  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return { error: 'Invalid decision ID.' };
  }
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    return { error: 'Invalid workspace ID.' };
  }

  const parsed = validateEvidenceInputs(
    formData.get('title'),
    formData.get('description'),
    formData.get('sourceUrl')
  );

  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  // Verify decision exists, is readable via RLS, and belongs to the expected workspace
  const { data: decision, error: decisionErr } = await supabase
    .from('decisions')
    .select('id, workspace_id')
    .eq('id', decisionId)
    .maybeSingle();

  if (decisionErr || !decision) {
    return { error: 'Decision not found or you do not have access to its workspace.' };
  }
  if (decision.workspace_id !== workspaceId) {
    return { error: 'Evidence cannot be linked to a decision from a different workspace.' };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('evidence')
    .insert({
      decision_id: decision.id,
      workspace_id: decision.workspace_id,
      title: parsed.title,
      description: parsed.description,
      source_url: parsed.sourceUrl,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    return {
      error: insertErr?.message ?? 'Could not add evidence. Please check your permissions.',
    };
  }

  revalidatePath(`/decisions/${decision.id}`);
  revalidatePath(`/workspaces/${decision.workspace_id}`);

  return {
    success: 'Evidence added successfully.',
    actionId: inserted.id,
  };
}

export async function updateEvidenceAction(
  _prevState: EvidenceActionState | undefined,
  formData: FormData
): Promise<EvidenceActionState> {
  await requireUser();

  const evidenceId = Number(formData.get('evidenceId'));
  const decisionId = Number(formData.get('decisionId'));

  if (!Number.isInteger(evidenceId) || evidenceId <= 0) {
    return { error: 'Invalid evidence ID.' };
  }
  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return { error: 'Invalid decision ID.' };
  }

  const parsed = validateEvidenceInputs(
    formData.get('title'),
    formData.get('description'),
    formData.get('sourceUrl')
  );

  if ('error' in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  const { data: updated, error: updateErr } = await supabase
    .from('evidence')
    .update({
      title: parsed.title,
      description: parsed.description,
      source_url: parsed.sourceUrl,
    })
    .eq('id', evidenceId)
    .eq('decision_id', decisionId)
    .select('id, workspace_id')
    .maybeSingle();

  if (updateErr) {
    return { error: updateErr.message };
  }
  if (!updated) {
    return { error: 'Evidence not found or you do not have permission to edit it.' };
  }

  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath(`/workspaces/${updated.workspace_id}`);

  return {
    success: 'Evidence updated successfully.',
    actionId: updated.id,
  };
}

export async function deleteEvidenceAction(
  _prevState: EvidenceActionState | undefined,
  formData: FormData
): Promise<EvidenceActionState> {
  await requireUser();

  const evidenceId = Number(formData.get('evidenceId'));
  const decisionId = Number(formData.get('decisionId'));

  if (!Number.isInteger(evidenceId) || evidenceId <= 0) {
    return { error: 'Invalid evidence ID.' };
  }
  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return { error: 'Invalid decision ID.' };
  }

  const supabase = await createClient();

  const { data: deleted, error: deleteErr } = await supabase
    .from('evidence')
    .delete()
    .eq('id', evidenceId)
    .eq('decision_id', decisionId)
    .select('id, workspace_id')
    .maybeSingle();

  if (deleteErr) {
    return { error: deleteErr.message };
  }
  if (!deleted) {
    return { error: 'Evidence not found or you do not have permission to delete it.' };
  }

  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath(`/workspaces/${deleted.workspace_id}`);

  return {
    success: 'Evidence deleted successfully.',
    actionId: deleted.id,
  };
}
