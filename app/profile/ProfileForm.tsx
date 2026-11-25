'use client';

import { useActionState } from 'react';
import { updateProfileAction } from '@/app/actions/profile';
import { logoutAction } from '@/app/actions/auth';
import Button from '@/app/components/Button';
import { getInitials, type UserProfile } from '@/app/lib/types';

export default function ProfileForm({ profile }: { profile: UserProfile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);
  const displayName = profile.full_name?.trim() || profile.email.split('@')[0] || 'User';

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
            {getInitials(displayName)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Member since{' '}
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            🚪 Log out
          </Button>
        </form>
      </div>

      {/* Edit profile form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Profile Information</h3>
        <p className="text-xs text-gray-500 mb-5">
          Your profile is stored in the PostgreSQL <code className="bg-gray-100 px-1 rounded">public.users</code> table and protected by Row Level Security.
        </p>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              ✅ {state.success}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile.full_name}
              placeholder="Your name"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1.5">
              Bio / Role
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={profile.bio}
              placeholder="e.g. Product Designer working on mobile experiences"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
              Avatar URL (optional)
            </label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              defaultValue={profile.avatar_url ?? ''}
              placeholder="https://example.com/avatar.png"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
