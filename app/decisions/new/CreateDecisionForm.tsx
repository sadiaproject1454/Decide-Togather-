'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createDecisionAction } from '@/app/actions/decisions';
import Button from '@/app/components/Button';
import type { WorkspaceSummary } from '@/app/lib/types';

export default function CreateDecisionForm({
  workspaces,
}: {
  workspaces: WorkspaceSummary[];
}) {
  const [state, formAction, pending] = useActionState(createDecisionAction, undefined);
  const [options, setOptions] = useState(['', '']);

  function addOption() {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  if (workspaces.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-sm text-gray-600 mb-4">
          You need at least one workspace before creating a decision.
        </p>
        <Button href="/dashboard">Go to Dashboard to create a workspace</Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">📝 Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
              Decision title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Which design system should we adopt?"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Provide context to help your team vote with confidence..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Workspace
              </label>
              <select
                id="workspaceId"
                name="workspaceId"
                defaultValue={workspaces[0].id}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1.5">
                Voting deadline
              </label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

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
                name="options"
                type="text"
                required={index < 2}
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

      <div className="flex items-center gap-3 justify-end">
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create Decision'}
        </Button>
      </div>
    </form>
  );
}
