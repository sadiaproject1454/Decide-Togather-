'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { requireUser } from '@/app/lib/auth';
import type { WorkspaceRole } from '@/app/lib/types';

export interface MemberActionState {
  error?: string;
  success?: string;
  actionId?: number;
}

const VALID_ROLES: WorkspaceRole[] = ['admin', 'member'];

function parseRole(raw: FormDataEntryValue | null): WorkspaceRole | null {
  const value = String(raw ?? '').trim();
  return VALID_ROLES.includes(value as WorkspaceRole) ? (value as WorkspaceRole) : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyCallerIsWorkspaceAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: number,
  callerId: string
): Promise<{ isAdmin: boolean; ownerId: string | null }> {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .maybeSingle();

  if (!workspace) {
    return { isAdmin: false, ownerId: null };
  }

  if (workspace.owner_id === callerId) {
    return { isAdmin: true, ownerId: workspace.owner_id };
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', callerId)
    .maybeSingle();

  return {
    isAdmin: membership?.role === 'admin',
    ownerId: workspace.owner_id,
  };
}

/**
 * Adds an existing registered Decide Together user to a workspace by email.
 * Restricted strictly to workspace admins via server verification + PostgreSQL RPC/RLS.
 */
export async function addWorkspaceMemberAction(
  _prevState: MemberActionState | undefined,
  formData: FormData
): Promise<MemberActionState> {
  const user = await requireUser();

  const workspaceId = Number(formData.get('workspaceId'));
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = parseRole(formData.get('role') ?? 'member');

  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    return { error: 'Invalid workspace ID.' };
  }
  if (!email || !isValidEmail(email) || email.length > 254) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!role) {
    return { error: 'Role must be either admin or member.' };
  }

  const supabase = await createClient();
  const authz = await verifyCallerIsWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!authz.ownerId || !authz.isAdmin) {
    return { error: 'Only workspace admins can add members.' };
  }

  const { data, error } = await supabase.rpc('add_workspace_member_by_email', {
    p_workspace_id: workspaceId,
    p_email: email,
    p_role: role,
  });

  if (error) {
    const msg = error.message || '';
    if (error.code === 'PGRST202' || msg.includes('add_workspace_member_by_email')) {
      return {
        error:
          'Database migration 20261128000002_workspace_membership_foundation.sql must be applied in Supabase before adding members by email.',
      };
    }
    return { error: msg || 'Could not add workspace member.' };
  }

  const inserted = Array.isArray(data) ? data[0] : data;

  revalidatePath('/dashboard');
  revalidatePath('/workspaces');
  revalidatePath(`/workspaces/${workspaceId}`);

  return {
    success: `Added ${email} as ${role === 'admin' ? 'an admin' : 'a member'}.`,
    actionId: inserted?.id ?? workspaceId,
  };
}

/**
 * Updates another member's workspace role ('admin' or 'member').
 * Blocks non-admins, prevents self-role modification, and protects the workspace creator.
 */
export async function updateMemberRoleAction(
  _prevState: MemberActionState | undefined,
  formData: FormData
): Promise<MemberActionState> {
  const user = await requireUser();

  const workspaceId = Number(formData.get('workspaceId'));
  const memberId = Number(formData.get('memberId'));
  const role = parseRole(formData.get('role'));

  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    return { error: 'Invalid workspace ID.' };
  }
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return { error: 'Invalid member ID.' };
  }
  if (!role) {
    return { error: 'Role must be either admin or member.' };
  }

  const supabase = await createClient();
  const authz = await verifyCallerIsWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!authz.ownerId || !authz.isAdmin) {
    return { error: 'Only workspace admins can change member roles.' };
  }

  const { data: targetMember, error: fetchErr } = await supabase
    .from('workspace_members')
    .select('id, user_id, role')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (fetchErr || !targetMember) {
    return { error: 'Workspace member not found.' };
  }

  if (targetMember.user_id === user.id) {
    return { error: 'You cannot change your own workspace role.' };
  }
  if (targetMember.user_id === authz.ownerId) {
    return { error: 'The workspace creator must remain an admin.' };
  }
  if (targetMember.role === role) {
    return { success: `Member is already ${role === 'admin' ? 'an admin' : 'a member'}.`, actionId: memberId };
  }

  const { data: updated, error: updateErr } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .select('id, role')
    .maybeSingle();

  if (updateErr) {
    return { error: updateErr.message };
  }
  if (!updated) {
    return { error: 'Could not update member role or permission denied.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/workspaces');
  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath('/decisions', 'layout');

  return {
    success: `Role updated to ${updated.role}.`,
    actionId: updated.id,
  };
}

/**
 * Removes a member from a workspace (admin action) or lets a non-owner member leave.
 */
export async function removeWorkspaceMemberAction(
  _prevState: MemberActionState | undefined,
  formData: FormData
): Promise<MemberActionState> {
  const user = await requireUser();

  const workspaceId = Number(formData.get('workspaceId'));
  const memberId = Number(formData.get('memberId'));

  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    return { error: 'Invalid workspace ID.' };
  }
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return { error: 'Invalid member ID.' };
  }

  const supabase = await createClient();
  const authz = await verifyCallerIsWorkspaceAdmin(supabase, workspaceId, user.id);
  if (!authz.ownerId) {
    return { error: 'Workspace not found or you do not have access.' };
  }

  const { data: targetMember, error: fetchErr } = await supabase
    .from('workspace_members')
    .select('id, user_id')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (fetchErr || !targetMember) {
    return { error: 'Workspace member not found.' };
  }

  if (targetMember.user_id === authz.ownerId) {
    return { error: 'The workspace creator cannot be removed from the workspace.' };
  }

  const isSelfLeave = targetMember.user_id === user.id;
  if (!isSelfLeave && !authz.isAdmin) {
    return { error: 'Only workspace admins can remove other members.' };
  }

  const { data: deleted, error: deleteErr } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .select('id, user_id')
    .maybeSingle();

  if (deleteErr) {
    return { error: deleteErr.message };
  }
  if (!deleted) {
    return { error: 'Could not remove member or permission denied.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/workspaces');
  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath('/decisions', 'layout');

  if (isSelfLeave) {
    redirect('/workspaces?left=1');
  }

  return {
    success: 'Member removed from workspace.',
    actionId: deleted.id,
  };
}
