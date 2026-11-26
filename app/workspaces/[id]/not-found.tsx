import Link from 'next/link';
import AuthenticatedShell from '@/app/components/AuthenticatedShell';
import Button from '@/app/components/Button';
import { Suspense } from 'react';

export default function WorkspaceNotFound() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading…</div>}>
      <AuthenticatedShell>
        <div className="p-6 md:p-12 max-w-lg mx-auto text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-4">
              🔒
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Workspace not found</h1>
            <p className="text-sm text-gray-500 mb-6">
              This workspace may have been deleted, or you don&apos;t have permission to view it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button href="/workspaces" size="sm">
                View My Workspaces
              </Button>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AuthenticatedShell>
    </Suspense>
  );
}
