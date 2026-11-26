import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import AuthenticatedShell from '@/app/components/AuthenticatedShell';
import CreateWorkspaceForm from '@/app/components/CreateWorkspaceForm';
import { Badge } from '@/app/components/Badge';
import { requireUser } from '@/app/lib/auth';
import { getUserWorkspaces } from '@/app/lib/db';
import DeletedWorkspaceBanner from './DeletedWorkspaceBanner';

async function WorkspacesListContent() {
  await connection();
  const user = await requireUser();
  const workspaces = await getUserWorkspaces();

  return (
    <AuthenticatedShell>
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
            <p className="text-sm text-gray-500 mt-1">
              Organize your team&apos;s decisions into dedicated spaces ({workspaces.length}{' '}
              {workspaces.length === 1 ? 'workspace' : 'workspaces'}).
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium self-start sm:self-auto"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <Suspense fallback={null}>
          <DeletedWorkspaceBanner />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Workspace List (2 cols on desktop) */}
          <div className="lg:col-span-2">
            {workspaces.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 sm:p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto mb-4">
                  🏢
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">
                  No workspaces yet
                </h2>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Create your first workspace using the form to start organizing team decisions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workspaces.map((ws) => {
                  const isOwner = ws.owner_id === user.id;
                  return (
                    <div
                      key={ws.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base shrink-0">
                              {ws.name[0]?.toUpperCase() ?? 'W'}
                            </div>
                            <div className="min-w-0">
                              <h2 className="text-base font-semibold text-gray-900 truncate">
                                {ws.name}
                              </h2>
                              <p className="text-xs text-gray-400">
                                Created{' '}
                                {new Date(ws.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge
                            label={isOwner ? 'Owner' : 'Member'}
                            color={isOwner ? 'indigo' : 'gray'}
                          />
                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 min-h-[2.25rem]">
                          {ws.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400">
                          👥 {ws.memberCount} · 🗳️ {ws.decisionCount}
                        </span>
                        <Link
                          href={`/workspaces/${ws.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          Open Workspace →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create Workspace Sidebar Card */}
          <div className="lg:sticky lg:top-6">
            <CreateWorkspaceForm defaultOpen />
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}

export default function WorkspacesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading workspaces…</div>}>
      <WorkspacesListContent />
    </Suspense>
  );
}
