import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import AuthenticatedShell from '@/app/components/AuthenticatedShell';
import { requireUser } from '@/app/lib/auth';
import { getUserWorkspaces } from '@/app/lib/db';
import CreateDecisionForm from './CreateDecisionForm';

async function NewDecisionContent() {
  await connection();
  await requireUser();
  const workspaces = await getUserWorkspaces();

  return (
    <AuthenticatedShell>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-gray-600">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">New Decision</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create a Decision</h1>
          <p className="text-sm text-gray-500 mt-1">
            Describe the decision, add options, and save it to PostgreSQL.
          </p>
        </div>

        <CreateDecisionForm workspaces={workspaces} />
      </div>
    </AuthenticatedShell>
  );
}

export default function CreateDecisionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading form…</div>}>
      <NewDecisionContent />
    </Suspense>
  );
}
