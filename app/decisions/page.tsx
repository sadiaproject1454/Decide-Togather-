// Decisions listing page  →  Route: /decisions
// Shows all decisions across all workspaces

import { SAMPLE_DECISIONS, SAMPLE_WORKSPACES } from '@/app/lib/data';
import DecisionCard from '@/app/components/DecisionCard';
import Button from '@/app/components/Button';
import Sidebar from '@/app/components/Sidebar';
import { StatusBadge } from '@/app/components/Badge';

export default function DecisionsPage() {
  const open = SAMPLE_DECISIONS.filter((d) => d.status === 'open');
  const voting = SAMPLE_DECISIONS.filter((d) => d.status === 'voting');
  const closed = SAMPLE_DECISIONS.filter((d) => d.status === 'closed');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Decisions</h1>
              <p className="text-sm text-gray-500 mt-1">{SAMPLE_DECISIONS.length} total decisions across {SAMPLE_WORKSPACES.length} workspaces</p>
            </div>
            <Button href="/decisions/new">+ New Decision</Button>
          </div>

          {/* Voting now */}
          {voting.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-gray-900">Actively Voting</h2>
                <StatusBadge status="voting" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {voting.map((d) => <DecisionCard key={d.id} decision={d} />)}
              </div>
            </section>
          )}

          {/* Open */}
          {open.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-gray-900">Open for Input</h2>
                <StatusBadge status="open" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {open.map((d) => <DecisionCard key={d.id} decision={d} />)}
              </div>
            </section>
          )}

          {/* Closed */}
          {closed.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-gray-900">Closed</h2>
                <StatusBadge status="closed" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {closed.map((d) => <DecisionCard key={d.id} decision={d} />)}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
