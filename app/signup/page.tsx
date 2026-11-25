'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signupAction } from '@/app/actions/auth';
import Button from '@/app/components/Button';

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-gray-900 text-xl">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          Decide Together
        </Link>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-200 sm:px-10">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {state.error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Alice Johnson"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <Button type="submit" fullWidth disabled={pending}>
              {pending ? 'Creating account…' : 'Create free account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            By signing up you agree to our{' '}
            <Link href="#" className="underline">Terms of Service</Link>{' '}
            and{' '}
            <Link href="#" className="underline">Privacy Policy</Link>.
          </p>
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span>✅ Free forever for small teams</span>
            <span>✅ No credit card</span>
          </div>
        </div>
      </div>
    </div>
  );
}
