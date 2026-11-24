// ============================================================
// Sample data and TypeScript types for Decide Together
// (No real database yet — we use this until Supabase is set up)
// ============================================================

export type DecisionStatus = 'open' | 'voting' | 'closed';

export interface Option {
  id: string;
  label: string;
  votes: number;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  status: DecisionStatus;
  workspaceId: string;
  createdAt: string;
  deadline: string;
  options: Option[];
  totalVoters: number;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  decisionCount: number;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatarInitials: string;
}

// -----------------------------------------------------------
// Sample Workspaces
// -----------------------------------------------------------
export const SAMPLE_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Product Team',
    description: 'Decisions for the core product roadmap and features.',
    memberCount: 8,
    decisionCount: 12,
    createdAt: '2026-09-01',
  },
  {
    id: 'ws-2',
    name: 'Marketing',
    description: 'Campaign choices, branding, and content strategy.',
    memberCount: 5,
    decisionCount: 7,
    createdAt: '2026-09-15',
  },
  {
    id: 'ws-3',
    name: 'Engineering',
    description: 'Tech stack, architecture, and tooling decisions.',
    memberCount: 10,
    decisionCount: 20,
    createdAt: '2026-08-20',
  },
];

// -----------------------------------------------------------
// Sample Decisions
// -----------------------------------------------------------
export const SAMPLE_DECISIONS: Decision[] = [
  {
    id: 'dec-1',
    title: 'Which frontend framework should we use?',
    description:
      'We need to choose a framework for the new customer portal. Options are React, Vue, and Svelte. Consider performance, team familiarity, and ecosystem.',
    status: 'voting',
    workspaceId: 'ws-3',
    createdAt: '2026-11-01',
    deadline: '2026-11-30',
    options: [
      { id: 'o-1', label: 'React', votes: 7 },
      { id: 'o-2', label: 'Vue', votes: 2 },
      { id: 'o-3', label: 'Svelte', votes: 1 },
    ],
    totalVoters: 10,
  },
  {
    id: 'dec-2',
    title: 'Q1 2027 Marketing Campaign Theme',
    description:
      'What theme should drive our Q1 campaign? We want something that resonates with our target audience of small business owners.',
    status: 'open',
    workspaceId: 'ws-2',
    createdAt: '2026-11-10',
    deadline: '2026-12-05',
    options: [
      { id: 'o-4', label: 'Growth & Scale', votes: 1 },
      { id: 'o-5', label: 'Simplify Your Work', votes: 3 },
      { id: 'o-6', label: 'Team First', votes: 0 },
    ],
    totalVoters: 5,
  },
  {
    id: 'dec-3',
    title: 'New feature: dark mode priority',
    description:
      'Should dark mode be prioritized in the next sprint, or should we focus on performance improvements first?',
    status: 'closed',
    workspaceId: 'ws-1',
    createdAt: '2026-10-15',
    deadline: '2026-10-25',
    options: [
      { id: 'o-7', label: 'Dark Mode first', votes: 5 },
      { id: 'o-8', label: 'Performance first', votes: 3 },
    ],
    totalVoters: 8,
  },
  {
    id: 'dec-4',
    title: 'Team offsite location for 2027',
    description:
      'Where should we hold our annual team offsite? We have three shortlisted cities.',
    status: 'open',
    workspaceId: 'ws-1',
    createdAt: '2026-11-18',
    deadline: '2026-12-15',
    options: [
      { id: 'o-9', label: 'Bali, Indonesia', votes: 4 },
      { id: 'o-10', label: 'Lisbon, Portugal', votes: 2 },
      { id: 'o-11', label: 'Mexico City, Mexico', votes: 2 },
    ],
    totalVoters: 8,
  },
  {
    id: 'dec-5',
    title: 'Which database should we migrate to?',
    description:
      'Our current database is struggling with scale. Should we migrate to PostgreSQL, MongoDB, or stay with MySQL?',
    status: 'voting',
    workspaceId: 'ws-3',
    createdAt: '2026-11-20',
    deadline: '2026-12-01',
    options: [
      { id: 'o-12', label: 'PostgreSQL', votes: 8 },
      { id: 'o-13', label: 'MongoDB', votes: 1 },
      { id: 'o-14', label: 'Stay with MySQL', votes: 1 },
    ],
    totalVoters: 10,
  },
];

// -----------------------------------------------------------
// Sample Members
// -----------------------------------------------------------
export const SAMPLE_MEMBERS: Member[] = [
  { id: 'm-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', avatarInitials: 'AJ' },
  { id: 'm-2', name: 'Bob Smith', email: 'bob@example.com', role: 'member', avatarInitials: 'BS' },
  { id: 'm-3', name: 'Carol White', email: 'carol@example.com', role: 'member', avatarInitials: 'CW' },
  { id: 'm-4', name: 'David Lee', email: 'david@example.com', role: 'member', avatarInitials: 'DL' },
];

// -----------------------------------------------------------
// Helper functions
// -----------------------------------------------------------
export function getWorkspaceById(id: string): Workspace | undefined {
  return SAMPLE_WORKSPACES.find((w) => w.id === id);
}

export function getDecisionById(id: string): Decision | undefined {
  return SAMPLE_DECISIONS.find((d) => d.id === id);
}

export function getDecisionsByWorkspace(workspaceId: string): Decision[] {
  return SAMPLE_DECISIONS.filter((d) => d.workspaceId === workspaceId);
}

export function getLeadingOption(decision: Decision): Option | null {
  if (decision.options.length === 0) return null;
  return decision.options.reduce((prev, curr) =>
    curr.votes > prev.votes ? curr : prev
  );
}
