export type DecisionStatus = 'open' | 'voting' | 'closed';
export type WorkspaceRole = 'admin' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSummary {
  id: number;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  memberCount: number;
  decisionCount: number;
  currentUserRole?: WorkspaceRole;
  isOwner?: boolean;
}

export interface WorkspaceMemberItem {
  id: number;
  workspace_id: number;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  isOwner?: boolean;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface DecisionOptionItem {
  id: number;
  decision_id: number;
  label: string;
  votes: number;
  created_at: string;
}

export interface DecisionItem {
  id: number;
  workspace_id: number;
  created_by: string;
  title: string;
  description: string;
  status: DecisionStatus;
  deadline: string | null;
  created_at: string;
  options: DecisionOptionItem[];
}

export interface EvidenceItem {
  id: number;
  decision_id: number;
  workspace_id: number;
  title: string;
  description: string | null;
  source_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creatorName: string;
  canManage: boolean;
}

export type OptionPointType = 'pro' | 'con';

export interface DecisionOptionPointItem {
  id: number;
  decision_id: number;
  decision_option_id: number;
  workspace_id: number;
  type: OptionPointType;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creatorName: string;
  canManage: boolean;
}

export function getInitials(nameOrEmail: string): string {
  const cleaned = nameOrEmail.trim();
  if (!cleaned) return 'U';
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}
