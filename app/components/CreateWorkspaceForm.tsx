'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createWorkspaceAction } from '@/app/actions/workspaces';
import Button from '@/app/components/Button';

interface CreateWorkspaceFormProps {
  defaultOpen?: boolean;
}

export default function CreateWorkspaceForm({ defaultOpen = false }: CreateWorkspaceFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [clientError, setClientError] = useState('');
  const [state, formAction, pending] = useActionState(createWorkspaceAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const lastSuccessId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state?.success && state.workspaceId && state.workspaceId !== lastSuccessId.current) {
      lastSuccessId.current = state.workspaceId;
      formRef.current?.reset();
    }
  }, [state]);

  function handleClientValidation(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const trimmedName = String(formData.get('name') ?? '').trim();
    const trimmedDesc = String(formData.get('description') ?? '').trim();

    if (trimmedName.length < 2) {
      e.preventDefault();
      setClientError('Workspace name must be at least 2 characters.');
      return;
    }
    if (trimmedName.length > 80) {
      e.preventDefault();
      setClientError('Workspace name must be 80 characters or fewer.');
      return;
    }
    if (trimmedDesc.length > 500) {
      e.preventDefault();
      setClientError('Description must be 500 characters or fewer.');
      return;
    }

    setClientError('');
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" fullWidth onClick={() => setOpen(true)}>
        + New Workspace
      </Button>
    );
  }

  const errorMessage = clientError || state?.error;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleClientValidation}
      noValidate
      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Create Workspace</h3>
        {!defaultOpen && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setClientError('');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg"
        >
          {errorMessage}
        </div>
      )}

      {state?.success && !clientError && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2.5 rounded-lg flex items-center justify-between gap-2"
        >
          <span>✅ {state.success}</span>
          {state.workspaceId && (
            <Link
              href={`/workspaces/${state.workspaceId}`}
              className="font-semibold underline whitespace-nowrap hover:text-green-900"
            >
              Open →
            </Link>
          )}
        </div>
      )}

      <div>
        <label htmlFor="ws-create-name" className="block text-xs font-medium text-gray-700 mb-1">
          Workspace name <span className="text-red-500">*</span>
        </label>
        <input
          id="ws-create-name"
          name="name"
          type="text"
          required
          maxLength={80}
          onChange={() => {
            if (clientError) setClientError('');
          }}
          placeholder="e.g. Product Team"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="ws-create-desc" className="block text-xs font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          id="ws-create-desc"
          name="description"
          rows={2}
          maxLength={500}
          onChange={() => {
            if (clientError) setClientError('');
          }}
          placeholder="What decisions will this workspace organize?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <Button type="submit" size="sm" fullWidth disabled={pending}>
        {pending ? 'Creating workspace…' : 'Create Workspace'}
      </Button>
    </form>
  );
}
