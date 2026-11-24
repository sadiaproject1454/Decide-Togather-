'use client';
// PAGE 6: Create Decision Page  →  Route: /decisions/new
// Client Component — has multi-step form with state

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/app/components/Button';
import Sidebar from '@/app/components/Sidebar';
import { SAMPLE_WORKSPACES } from '@/app/lib/data';

export default function CreateDecisionPage() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState('ws-1');
  const [deadline, setDeadline] = useState('');
  const [options, setOptions] = useState(['', '']); // start with 2 empty options
  const [loading, setLoading] = useState(false);

  // Add a new blank option field
  function addOption() {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  }

  // Update a specific option by index
  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  // Remove an option by index
  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const filledOptions = options.filter((o) => o.trim() !== '');
    if (filledOptions.length < 2) {
      alert('Please add at least 2 options.');
      return;
    }

    setLoading(true);
    // Simulate saving (replace with Supabase insert later)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Redirect to a sample decision (in real app, redirect to the new decision's ID)
    router.push('/decisions/dec-1');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/dashboard" className="hover:text-gray-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-600 font-medium">New Decision</span>
          </nav>

          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create a Decision</h1>
            <p className="text-sm text-gray-500 mt-1">
              Describe the decision, add options, and let your team vote.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Decision title */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4">📝 Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Decision title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Which design system should we adopt?"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide context to help your team vote with confidence..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Workspace */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Workspace
                    </label>
                    <select
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {SAMPLE_WORKSPACES.map((ws) => (
                        <option key={ws.id} value={ws.id}>{ws.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Voting deadline
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 mb-1">🗳️ Options</h2>
              <p className="text-xs text-gray-400 mb-4">Add at least 2 options for your team to vote on. Max 8.</p>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                        title="Remove option"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 8 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  + Add option
                </button>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 justify-end">
              <Button href="/dashboard" variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Create Decision'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
