import { createClient } from '@/app/lib/supabase/server';
import type {
  DecisionItem,
  DecisionStatus,
  WorkspaceMemberItem,
  WorkspaceSummary,
} from '@/app/lib/types';

export async function getUserWorkspaces(): Promise<WorkspaceSummary[]> {
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
      .select('workspace_id')
      .in('workspace_id', workspaceIds),
    supabase
      .from('decisions')
      .select('workspace_id')
      .in('workspace_id', workspaceIds),
  ]);

  return workspaces.map((w) => ({
    ...w,
    memberCount: members?.filter((m) => m.workspace_id === w.id).length ?? 1,
    decisionCount: decisions?.filter((d) => d.workspace_id === w.id).length ?? 0,
  }));
}

export async function getWorkspaceDetails(workspaceId: number): Promise<{
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

  const members: WorkspaceMemberItem[] = (membersData ?? []).map((m) => {
    const joinedUser = Array.isArray(m.users) ? m.users[0] : m.users;
    return {
      id: m.id,
      workspace_id: m.workspace_id,
      user_id: m.user_id,
      role: (m.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
      joined_at: m.joined_at,
      user: joinedUser ?? {
        id: m.user_id,
        email: '',
        full_name: 'Member',
        avatar_url: null,
      },
    };
  });

  return {
    workspace: {
      ...ws,
      memberCount: members.length || 1,
      decisionCount: decisions.length,
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

export async function getDecisionDetails(decisionId: number): Promise<{
  decision: DecisionItem;
  workspaceName: string;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('decisions')
    .select('*, decision_options(*), workspaces(name)')
    .eq('id', decisionId)
    .maybeSingle();

  if (error || !data) return null;

  const wsObj = Array.isArray(data.workspaces) ? data.workspaces[0] : data.workspaces;

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
  };
}
