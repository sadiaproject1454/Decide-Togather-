import { Suspense } from 'react';
import { connection } from 'next/server';
import AuthenticatedShell from '@/app/components/AuthenticatedShell';
import { requireUser } from '@/app/lib/auth';
import ProfileForm from './ProfileForm';

async function ProfileContent() {
  await connection();
  const { profile } = await requireUser();

  return (
    <AuthenticatedShell>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account details and public team profile.
          </p>
        </div>
        <ProfileForm profile={profile} />
      </div>
    </AuthenticatedShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading profile…</div>}>
      <ProfileContent />
    </Suspense>
  );
}
