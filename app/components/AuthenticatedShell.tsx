import React from 'react';
import Sidebar from '@/app/components/Sidebar';
import { requireUser } from '@/app/lib/auth';
import { getUserWorkspaces } from '@/app/lib/db';

/**
 * Wraps protected pages with the authenticated sidebar and enforces login.
 */
export default async function AuthenticatedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();
  const workspaces = await getUserWorkspaces();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={profile} workspaces={workspaces} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
