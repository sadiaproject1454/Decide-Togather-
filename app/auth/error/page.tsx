import Link from 'next/link';
import Button from '@/app/components/Button';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-gray-900 text-xl">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          Decide Together
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-200 sm:px-10 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Sorry, we couldn&apos;t verify your authentication link. It may have expired or already been used.
          </p>
          <div className="space-y-3">
            <Button href="/login" fullWidth>
              Try logging in again
            </Button>
            <Button href="/signup" variant="outline" fullWidth>
              Create a new account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
