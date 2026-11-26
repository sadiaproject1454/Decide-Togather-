'use client';

import { useSearchParams } from 'next/navigation';

export default function DeletedDecisionBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('decisionDeleted') !== '1') {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-6 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl"
    >
      ✅ Decision deleted successfully.
    </div>
  );
}
