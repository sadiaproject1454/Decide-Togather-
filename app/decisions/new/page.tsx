import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import AuthenticatedShell from '@/app/components/AuthenticatedShell';
import { requireUser } from '@/app/lib/auth';
import { getUserWorkspaces } from '@/app/lib/db';
import CreateDecisionForm from './CreateDecisionForm';

async function NewDecisionContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  await requireUser();
  const [workspaces, resolvedSearch] = await Promise.all([
    getUserWorkspaces(),
    searchParamsPromise,
  ]);

  const rawWsId = resolvedSearch.workspaceId;
  const parsedWsId = typeof rawWsId === 'string' ? Number(rawWsId) : undefined;
  const defaultWorkspaceId =
    parsedWsId && Number.isInteger(parsedWsId) && parsedWsId > 0 ? parsedWsId : undefined;

  return (
    <AuthenticatedShell>
      <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-gray-600">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/decisions" className="hover:text-gray-600">
            Decisions
          </Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">New Decision</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create a Decision</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define the decision inside a workspace and add multiple options.
          </p>
        </div>

        <CreateDecisionForm
          workspaces={workspaces}
          defaultWorkspaceId={defaultWorkspaceId}
        />
      </div>
    </AuthenticatedShell>
  );
}

export default function CreateDecisionPage(props: PageProps<'/decisions/new'>) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading form…</div>}>
      <NewDecisionContent searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}
