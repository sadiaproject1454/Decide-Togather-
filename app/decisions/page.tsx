import { Suspense } from 'react';
import { connection } from 'next/server';
import AuthenticatedShell from '@/app/components/AuthenticatedShell';
import DecisionCard from '@/app/components/DecisionCard';
import Button from '@/app/components/Button';
import { StatusBadge } from '@/app/components/Badge';
import { requireUser } from '@/app/lib/auth';
import { getAllUserDecisions, getUserWorkspaces } from '@/app/lib/db';

async function DecisionsContent() {
  await connection();
  await requireUser();
  const [decisions, workspaces] = await Promise.all([
    getAllUserDecisions(),
    getUserWorkspaces(),
  ]);

  const open = decisions.filter((d) => d.status === 'open');
  const voting = decisions.filter((d) => d.status === 'voting');
  const closed = decisions.filter((d) => d.status === 'closed');

  return (
    <AuthenticatedShell>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Decisions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {decisions.length} total decisions across {workspaces.length} workspaces
            </p>
          </div>
          <Button href="/decisions/new">+ New Decision</Button>
        </div>

        {decisions.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-sm text-gray-500 mb-4">No decisions created yet.</p>
            <Button href="/decisions/new">+ Create your first decision</Button>
          </div>
        ) : (
          <>
            {voting.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-semibold text-gray-900">Actively Voting</h2>
                  <StatusBadge status="voting" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {voting.map((d) => (
                    <DecisionCard key={d.id} decision={d} />
                  ))}
                </div>
              </section>
            )}

            {open.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-semibold text-gray-900">Open for Input</h2>
                  <StatusBadge status="open" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {open.map((d) => (
                    <DecisionCard key={d.id} decision={d} />
                  ))}
                </div>
              </section>
            )}

            {closed.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-semibold text-gray-900">Closed</h2>
                  <StatusBadge status="closed" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {closed.map((d) => (
                    <DecisionCard key={d.id} decision={d} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AuthenticatedShell>
  );
}

export default function DecisionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading decisions…</div>}>
      <DecisionsContent />
    </Suspense>
  );
}
