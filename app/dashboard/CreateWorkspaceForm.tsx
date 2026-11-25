'use client';

import { useActionState, useState } from 'react';
import { createWorkspaceAction } from '@/app/actions/workspaces';
import Button from '@/app/components/Button';

export default function CreateWorkspaceForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createWorkspaceAction, undefined);

  if (!open) {
    return (
      <Button variant="outline" size="sm" fullWidth onClick={() => setOpen(true)}>
        + New Workspace
      </Button>
    );
  }

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Create Workspace</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
          {state.error}
        </div>
      )}

      <input
        name="name"
        type="text"
        required
        placeholder="Workspace name (e.g. Engineering)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        name="description"
        type="text"
        placeholder="Short description (optional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <Button type="submit" size="sm" fullWidth disabled={pending}>
        {pending ? 'Creating…' : 'Create Workspace'}
      </Button>
    </form>
  );
}
