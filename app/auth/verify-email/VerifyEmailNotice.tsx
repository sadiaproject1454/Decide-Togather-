'use client';

import { useSearchParams } from 'next/navigation';

export default function VerifyEmailNotice() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <p className="text-sm text-gray-500 leading-relaxed mb-6">
      We sent a confirmation link to{' '}
      {email ? <strong className="text-gray-900">{email}</strong> : 'your email address'}.
      Click the link in that email to activate your account, then log in.
    </p>
  );
}
