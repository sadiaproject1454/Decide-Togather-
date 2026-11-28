import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedShell from '@/app/components/AuthenticatedShell';
import DecisionCard from '@/app/components/DecisionCard';
import Button from '@/app/components/Button';
import { Badge } from '@/app/components/Badge';
import { requireUser } from '@/app/lib/auth';
import { getWorkspaceDetails } from '@/app/lib/db';
import WorkspaceManageControls from './WorkspaceManageControls';
import WorkspaceMembersPanel from './WorkspaceMembersPanel';
import DeletedDecisionBanner from './DeletedDecisionBanner';

async function WorkspaceContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  await connection();
  const currentUser = await requireUser();
  const { id } = await paramsPromise;
  const workspaceId = Number(id);

  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    notFound();
  }

  const data = await getWorkspaceDetails(workspaceId, currentUser.id);
  if (!data) {
    notFound();
  }

  const { workspace, decisions, members } = data;
  const isOwner = workspace.owner_id === currentUser.id;
  const isAdmin =
    isOwner || members.some((m) => m.user_id === currentUser.id && m.role === 'admin');

  return (
    <AuthenticatedShell>
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <Link href="/dashboard" className="hover:text-gray-600">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/workspaces" className="hover:text-gray-600">
            Workspaces
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-xs">{workspace.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                {workspace.name[0]?.toUpperCase() ?? 'W'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
                <Badge
                  label={isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
                  color={isOwner || isAdmin ? 'indigo' : 'gray'}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 max-w-lg">
              {workspace.description || 'Collaborative workspace for your team.'}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
              <span>👥 {workspace.memberCount} members</span>
              <span>🗳️ {workspace.decisionCount} decisions</span>
              <span>
                📅 Created{' '}
                {new Date(workspace.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <Button href={`/decisions/new?workspaceId=${workspace.id}`}>+ New Decision</Button>
        </div>

        <Suspense fallback={null}>
          <DeletedDecisionBanner />
        </Suspense>

        {/* Edit & Delete Workspace Controls */}
        <WorkspaceManageControls
          workspaceId={workspace.id}
          initialName={workspace.name}
          initialDescription={workspace.description}
          decisionCount={decisions.length}
          canEdit={isAdmin}
          canDelete={isOwner}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Decisions inside this workspace */}
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4">
              Decisions ({decisions.length})
            </h2>
            {decisions.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                <p className="text-sm text-gray-400 mb-4">No decisions yet in this workspace.</p>
                <Button href={`/decisions/new?workspaceId=${workspace.id}`} variant="outline" size="sm">
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
          <WorkspaceMembersPanel
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            currentUserId={currentUser.id}
            isAdmin={isAdmin}
            members={members}
          />
        </div>
      </div>
    </AuthenticatedShell>
  );
}

export default function WorkspacePage(props: PageProps<'/workspaces/[id]'>) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading workspace…</div>}>
      <WorkspaceContent paramsPromise={props.params} />
    </Suspense>
  );
}
