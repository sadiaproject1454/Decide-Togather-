// PAGE 4: Dashboard  →  Route: /dashboard
// Overview page shown after login — stats + recent decisions + workspaces

import Link from 'next/link';
import { SAMPLE_DECISIONS, SAMPLE_WORKSPACES } from '@/app/lib/data';
import { StatusBadge } from '@/app/components/Badge';
import Button from '@/app/components/Button';
import DecisionCard from '@/app/components/DecisionCard';

// Summary stat card
function StatCard({ label, value, icon, color }: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const openDecisions = SAMPLE_DECISIONS.filter((d) => d.status === 'open').length;
  const votingDecisions = SAMPLE_DECISIONS.filter((d) => d.status === 'voting').length;
  const recentDecisions = SAMPLE_DECISIONS.slice(0, 4);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good evening, Alice 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening across your workspaces.</p>
        </div>
        <Button href="/decisions/new">
          + New Decision
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Decisions" value={SAMPLE_DECISIONS.length} icon="🗳️" color="bg-indigo-50" />
        <StatCard label="Open for Input" value={openDecisions} icon="📬" color="bg-green-50" />
        <StatCard label="Actively Voting" value={votingDecisions} icon="⚡" color="bg-yellow-50" />
        <StatCard label="Workspaces" value={SAMPLE_WORKSPACES.length} icon="🏢" color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Decisions (takes up 2 columns) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Decisions</h2>
            <Link href="/decisions" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentDecisions.map((decision) => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        </div>

        {/* Workspaces sidebar column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Your Workspaces</h2>
          </div>
          <div className="space-y-3">
            {SAMPLE_WORKSPACES.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {ws.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 truncate">
                    {ws.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {ws.memberCount} members · {ws.decisionCount} decisions
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button href="/decisions/new" variant="primary" size="sm" fullWidth>
                + Create Decision
              </Button>
              <Button href="/workspaces/ws-1" variant="secondary" size="sm" fullWidth>
                Browse Workspace
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
