import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import AuthenticatedShell from '@/app/components/AuthenticatedShell';
import { requireUser } from '@/app/lib/auth';
import { getDecisionDetails } from '@/app/lib/db';
import DecisionDetailClient from './DecisionDetailClient';

async function DecisionDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  await connection();
  const currentUser = await requireUser();
  const { id } = await paramsPromise;
  const decisionId = Number(id);

  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    notFound();
  }

  const data = await getDecisionDetails(decisionId, currentUser.id);
  if (!data) {
    notFound();
  }

  return (
    <AuthenticatedShell>
      <DecisionDetailClient
        decision={data.decision}
        workspaceName={data.workspaceName}
        creatorName={data.creatorName}
        canManage={data.canManage}
        evidence={data.evidence}
        optionPoints={data.optionPoints}
      />
    </AuthenticatedShell>
  );
}

export default function DecisionDetailPage(props: PageProps<'/decisions/[id]'>) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading decision…</div>}>
      <DecisionDetailContent paramsPromise={props.params} />
    </Suspense>
  );
}
