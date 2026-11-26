'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createDecisionAction } from '@/app/actions/decisions';
import Button from '@/app/components/Button';
import type { WorkspaceSummary } from '@/app/lib/types';

export default function CreateDecisionForm({
  workspaces,
  defaultWorkspaceId,
}: {
  workspaces: WorkspaceSummary[];
  defaultWorkspaceId?: number;
}) {
  const [state, formAction, pending] = useActionState(createDecisionAction, undefined);
  const [options, setOptions] = useState(['', '']);
  const [clientError, setClientError] = useState('');

  function addOption() {
    if (options.length < 8) {
      setOptions([...options, '']);
      if (clientError) setClientError('');
    }
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    if (clientError) setClientError('');
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      if (clientError) setClientError('');
    }
  }

  function handleClientValidation(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);

    if (title.length < 3) {
      e.preventDefault();
      setClientError('Decision title must be at least 3 characters.');
      return;
    }
    if (title.length > 120) {
      e.preventDefault();
      setClientError('Decision title must be 120 characters or fewer.');
      return;
    }
    if (description.length > 2000) {
      e.preventDefault();
      setClientError('Description must be 2000 characters or fewer.');
      return;
    }
    if (cleanedOptions.length < 2) {
      e.preventDefault();
      setClientError('Please provide at least 2 non-empty options.');
      return;
    }
    if (cleanedOptions.some((o) => o.length > 120)) {
      e.preventDefault();
      setClientError('Each option must be 120 characters or fewer.');
      return;
    }
    const lowerSet = new Set(cleanedOptions.map((o) => o.toLowerCase()));
    if (lowerSet.size !== cleanedOptions.length) {
      e.preventDefault();
      setClientError('Option labels must be unique.');
      return;
    }

    setClientError('');
  }

  if (workspaces.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
        <p className="text-sm text-gray-600 mb-4">
          You need at least one workspace before creating a decision.
        </p>
        <Button href="/workspaces">Go to Workspaces</Button>
      </div>
    );
  }

  const initialWorkspaceId =
    defaultWorkspaceId && workspaces.some((w) => w.id === defaultWorkspaceId)
      ? defaultWorkspaceId
      : workspaces[0].id;

  const errorMessage = clientError || state?.error;

  return (
    <form action={formAction} onSubmit={handleClientValidation} noValidate className="space-y-6">
      {errorMessage && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg"
        >
          {errorMessage}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
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
              maxLength={120}
              onChange={() => {
                if (clientError) setClientError('');
              }}
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
              maxLength={2000}
              onChange={() => {
                if (clientError) setClientError('');
              }}
              placeholder="Provide context to help your team understand the trade-offs..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Workspace <span className="text-red-500">*</span>
              </label>
              <select
                id="workspaceId"
                name="workspaceId"
                defaultValue={initialWorkspaceId}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="open"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="open">Open</option>
                <option value="voting">Voting</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1.5">
                Deadline (optional)
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

      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="font-semibold text-gray-900">📋 Decision Options</h2>
          <span className="text-xs text-gray-400">{options.length}/8 options</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Add at least 2 unique options for this decision (maximum 8).
        </p>

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
                maxLength={120}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-lg leading-none cursor-pointer"
                  title="Remove option"
                  aria-label={`Remove option ${index + 1}`}
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
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
          >
            + Add another option
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-end">
        <Link
          href={defaultWorkspaceId ? `/workspaces/${initialWorkspaceId}` : '/decisions'}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating decision…' : 'Create Decision'}
        </Button>
      </div>
    </form>
  );
}
