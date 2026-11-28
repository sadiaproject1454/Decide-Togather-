import { createClient } from '@/app/lib/supabase/server';
import type {
  DecisionItem,
  DecisionOptionPointItem,
  DecisionStatus,
  EvidenceItem,
  OptionPointType,
  WorkspaceMemberItem,
  WorkspaceRole,
  WorkspaceSummary,
} from '@/app/lib/types';

export async function getUserWorkspaces(currentUserId?: string): Promise<WorkspaceSummary[]> {
  const supabase = await createClient();

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !workspaces) return [];

  const workspaceIds = workspaces.map((w) => w.id);
  if (workspaceIds.length === 0) return [];

  const [{ data: members }, { data: decisions }] = await Promise.all([
    supabase
      .from('workspace_members')
      .select('workspace_id, user_id, role')
      .in('workspace_id', workspaceIds),
    supabase
      .from('decisions')
      .select('workspace_id')
      .in('workspace_id', workspaceIds),
  ]);

  return workspaces.map((w) => {
    const wsMembers = members?.filter((m) => m.workspace_id === w.id) ?? [];
    const isOwner = currentUserId ? w.owner_id === currentUserId : false;
    const myMembership = currentUserId
      ? wsMembers.find((m) => m.user_id === currentUserId)
      : undefined;
    const currentUserRole: WorkspaceRole | undefined = currentUserId
      ? isOwner || myMembership?.role === 'admin'
        ? 'admin'
        : 'member'
      : undefined;

    return {
      ...w,
      memberCount: wsMembers.length || 1,
      decisionCount: decisions?.filter((d) => d.workspace_id === w.id).length ?? 0,
      isOwner,
      currentUserRole,
    };
  });
}

export async function getWorkspaceDetails(
  workspaceId: number,
  currentUserId?: string
): Promise<{
  workspace: WorkspaceSummary;
  decisions: DecisionItem[];
  members: WorkspaceMemberItem[];
} | null> {
  const supabase = await createClient();

  const { data: ws, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .maybeSingle();

  if (error || !ws) return null;

  const [{ data: decisionsData }, { data: membersData }] = await Promise.all([
    supabase
      .from('decisions')
      .select('*, decision_options(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    supabase
      .from('workspace_members')
      .select('id, workspace_id, user_id, role, joined_at, users(id, email, full_name, avatar_url)')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true }),
  ]);

  const decisions: DecisionItem[] = (decisionsData ?? []).map((d) => ({
    id: d.id,
    workspace_id: d.workspace_id,
    created_by: d.created_by,
    title: d.title,
    description: d.description,
    status: d.status as DecisionStatus,
    deadline: d.deadline,
    created_at: d.created_at,
    options: (d.decision_options ?? []).sort((a, b) => a.id - b.id),
  }));

  const members: WorkspaceMemberItem[] = (membersData ?? [])
    .map((m) => {
      const joinedUser = Array.isArray(m.users) ? m.users[0] : m.users;
      const isMemberOwner = m.user_id === ws.owner_id;
      const normalizedRole: WorkspaceRole =
        isMemberOwner || m.role === 'admin' ? 'admin' : 'member';
      return {
        id: m.id,
        workspace_id: m.workspace_id,
        user_id: m.user_id,
        role: normalizedRole,
        joined_at: m.joined_at,
        isOwner: isMemberOwner,
        user: joinedUser ?? {
          id: m.user_id,
          email: '',
          full_name: 'Member',
          avatar_url: null,
        },
      };
    })
    .sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
      return a.joined_at.localeCompare(b.joined_at);
    });

  const isCurrentOwner = currentUserId ? ws.owner_id === currentUserId : false;
  const currentMembership = currentUserId
    ? members.find((m) => m.user_id === currentUserId)
    : undefined;
  const currentUserRole: WorkspaceRole | undefined = currentUserId
    ? isCurrentOwner || currentMembership?.role === 'admin'
      ? 'admin'
      : 'member'
    : undefined;

  return {
    workspace: {
      ...ws,
      memberCount: members.length || 1,
      decisionCount: decisions.length,
      isOwner: isCurrentOwner,
      currentUserRole,
    },
    decisions,
    members,
  };
}

export async function getAllUserDecisions(): Promise<DecisionItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('decisions')
    .select('*, decision_options(*)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    workspace_id: d.workspace_id,
    created_by: d.created_by,
    title: d.title,
    description: d.description,
    status: d.status as DecisionStatus,
    deadline: d.deadline,
    created_at: d.created_at,
    options: (d.decision_options ?? []).sort((a, b) => a.id - b.id),
  }));
}

export async function getDecisionDetails(
  decisionId: number,
  currentUserId?: string
): Promise<{
  decision: DecisionItem;
  workspaceName: string;
  creatorName: string;
  canManage: boolean;
  evidence: EvidenceItem[];
  optionPoints: DecisionOptionPointItem[];
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('decisions')
    .select(
      '*, decision_options(*), workspaces(name, owner_id), users!decisions_created_by_fkey(full_name, email)'
    )
    .eq('id', decisionId)
    .maybeSingle();

  if (error || !data) return null;

  const wsObj = Array.isArray(data.workspaces) ? data.workspaces[0] : data.workspaces;
  const creatorObj = Array.isArray(data.users) ? data.users[0] : data.users;
  const creatorName =
    creatorObj?.full_name?.trim() || creatorObj?.email || 'Team Member';

  let isWorkspaceAdmin = false;
  let canManage = false;
  if (currentUserId) {
    if (wsObj?.owner_id === currentUserId) {
      isWorkspaceAdmin = true;
      canManage = true;
    } else {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', data.workspace_id)
        .eq('user_id', currentUserId)
        .maybeSingle();
      isWorkspaceAdmin = membership?.role === 'admin';
      canManage = data.created_by === currentUserId || isWorkspaceAdmin;
    }
  }

  const [{ data: evidenceRows }, { data: pointRows }] = await Promise.all([
    supabase
      .from('evidence')
      .select('*, users!evidence_created_by_fkey(full_name, email)')
      .eq('decision_id', decisionId)
      .eq('workspace_id', data.workspace_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('decision_option_points')
      .select('*, users!decision_option_points_created_by_fkey(full_name, email)')
      .eq('decision_id', decisionId)
      .eq('workspace_id', data.workspace_id)
      .order('created_at', { ascending: true }),
  ]);

  const evidence: EvidenceItem[] = (evidenceRows ?? []).map((row) => {
    const evCreator = Array.isArray(row.users) ? row.users[0] : row.users;
    const evCreatorName =
      evCreator?.full_name?.trim() || evCreator?.email || 'Team Member';
    return {
      id: row.id,
      decision_id: row.decision_id,
      workspace_id: row.workspace_id,
      title: row.title,
      description: row.description,
      source_url: row.source_url,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creatorName: evCreatorName,
      canManage: Boolean(
        currentUserId && (row.created_by === currentUserId || isWorkspaceAdmin)
      ),
    };
  });

  const optionPoints: DecisionOptionPointItem[] = (pointRows ?? []).map((row) => {
    const ptCreator = Array.isArray(row.users) ? row.users[0] : row.users;
    const ptCreatorName =
      ptCreator?.full_name?.trim() || ptCreator?.email || 'Team Member';
    return {
      id: row.id,
      decision_id: row.decision_id,
      decision_option_id: row.decision_option_id,
      workspace_id: row.workspace_id,
      type: (row.type === 'con' ? 'con' : 'pro') as OptionPointType,
      content: row.content,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creatorName: ptCreatorName,
      canManage: Boolean(
        currentUserId && (row.created_by === currentUserId || isWorkspaceAdmin)
      ),
    };
  });

  return {
    decision: {
      id: data.id,
      workspace_id: data.workspace_id,
      created_by: data.created_by,
      title: data.title,
      description: data.description,
      status: data.status as DecisionStatus,
      deadline: data.deadline,
      created_at: data.created_at,
      options: (data.decision_options ?? []).sort((a, b) => a.id - b.id),
    },
    workspaceName: wsObj?.name ?? 'Workspace',
    creatorName,
    canManage,
    evidence,
    optionPoints,
  };
}
