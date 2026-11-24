// PAGE 5: Workspace Page  →  Route: /workspaces/[id]
// Server Component — renders workspace details with decisions and members.
// generateStaticParams tells Next.js which IDs to pre-render at build time.

import { notFound } from 'next/navigation';
import {
  getWorkspaceById,
  getDecisionsByWorkspace,
  SAMPLE_MEMBERS,
  SAMPLE_WORKSPACES,
} from '@/app/lib/data';
import DecisionCard from '@/app/components/DecisionCard';
import Button from '@/app/components/Button';
import { Badge } from '@/app/components/Badge';
import Sidebar from '@/app/components/Sidebar';

// Pre-render all known workspace IDs at build time
export function generateStaticParams() {
  return SAMPLE_WORKSPACES.map((ws) => ({ id: ws.id }));
}

export default async function WorkspacePage(props: PageProps<'/workspaces/[id]'>) {
  const { id } = await props.params;

  const workspace = getWorkspaceById(id);
  if (!workspace) {
    notFound();
  }

  const decisions = getDecisionsByWorkspace(id);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {workspace.name[0]}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
              </div>
              <p className="text-sm text-gray-500 max-w-lg">{workspace.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span>👥 {workspace.memberCount} members</span>
                <span>🗳️ {workspace.decisionCount} decisions</span>
                <span>📅 Created {new Date(workspace.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <Button href="/decisions/new">+ New Decision</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Decisions */}
            <div className="lg:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-4">
                Decisions ({decisions.length})
              </h2>
              {decisions.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                  <p className="text-gray-400 mb-4">No decisions yet in this workspace.</p>
                  <Button href="/decisions/new" variant="outline" size="sm">
                    Create the first decision
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {decisions.map((d) => (
                    <DecisionCard key={d.id} decision={d} />
                  ))}
                </div>
              )}
            </div>

            {/* Members */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">Members</h2>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {SAMPLE_MEMBERS.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-4">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {member.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                      <p className="text-xs text-gray-400 truncate">{member.email}</p>
                    </div>
                    <Badge
                      label={member.role}
                      color={member.role === 'admin' ? 'indigo' : 'gray'}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" fullWidth>
                  + Invite member
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
