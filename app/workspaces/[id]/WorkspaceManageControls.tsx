'use client';

import { useActionState, useState } from 'react';
import { deleteWorkspaceAction, updateWorkspaceAction } from '@/app/actions/workspaces';
import Button from '@/app/components/Button';

interface WorkspaceManageControlsProps {
  workspaceId: number;
  initialName: string;
  initialDescription: string;
  decisionCount: number;
  canEdit: boolean;
  canDelete: boolean;
}

function EditWorkspaceForm({
  workspaceId,
  initialName,
  initialDescription,
  onClose,
}: {
  workspaceId: number;
  initialName: string;
  initialDescription: string;
  onClose: () => void;
}) {
  const [clientError, setClientError] = useState('');
  const [editState, editAction, editPending] = useActionState(updateWorkspaceAction, undefined);

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  const editError = clientError || editState?.error;

  return (
    <form
      key={`${initialName}::${initialDescription}`}
      action={editAction}
      onSubmit={handleEditSubmit}
      noValidate
      className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-xl"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div>
        <h2 className="text-base font-semibold text-gray-900">Edit Workspace Details</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Changes are saved to PostgreSQL and verified by Row Level Security.
        </p>
      </div>

      {editState?.success && !clientError && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl"
        >
          ✅ {editState.success}
        </div>
      )}

      {editError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg"
        >
          {editError}
        </div>
      )}

      <div>
        <label htmlFor="edit-ws-name" className="block text-sm font-medium text-gray-700 mb-1">
          Workspace name <span className="text-red-500">*</span>
        </label>
        <input
          id="edit-ws-name"
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={initialName}
          onChange={() => {
            if (clientError) setClientError('');
          }}
          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="edit-ws-desc" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="edit-ws-desc"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={initialDescription}
          onChange={() => {
            if (clientError) setClientError('');
          }}
          placeholder="Describe what this workspace is for..."
          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={editPending}>
          {editPending ? 'Saving changes…' : 'Save Changes'}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={editPending} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function WorkspaceManageControls({
  workspaceId,
  initialName,
  initialDescription,
  decisionCount,
  canEdit,
  canDelete,
}: WorkspaceManageControlsProps) {
  const [mode, setMode] = useState<'idle' | 'edit' | 'delete'>('idle');
  const [deleteState, deleteAction, deletePending] = useActionState(deleteWorkspaceAction, undefined);

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && (
          <Button
            variant={mode === 'edit' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setMode(mode === 'edit' ? 'idle' : 'edit')}
          >
            ✏️ {mode === 'edit' ? 'Close Editor' : 'Edit Workspace'}
          </Button>
        )}
        {canDelete && (
          <Button
            variant={mode === 'delete' ? 'danger' : 'outline'}
            size="sm"
            onClick={() => setMode(mode === 'delete' ? 'idle' : 'delete')}
          >
            🗑️ {mode === 'delete' ? 'Cancel Delete' : 'Delete Workspace'}
          </Button>
        )}
      </div>

      {mode === 'edit' && canEdit && (
        <EditWorkspaceForm
          workspaceId={workspaceId}
          initialName={initialName}
          initialDescription={initialDescription}
          onClose={() => setMode('idle')}
        />
      )}

      {mode === 'delete' && canDelete && (
        <form
          action={deleteAction}
          className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4 max-w-xl"
        >
          <input type="hidden" name="workspaceId" value={workspaceId} />

          <div>
            <h2 className="text-base font-semibold text-red-900">Delete &ldquo;{initialName}&rdquo;?</h2>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              This permanently removes the workspace, its membership list, and{' '}
              <strong>{decisionCount}</strong> decision{decisionCount === 1 ? '' : 's'} inside it.
              This action cannot be undone.
            </p>
          </div>

          {deleteState?.error && (
            <div
              role="alert"
              className="bg-white border border-red-300 text-red-700 text-xs px-3 py-2 rounded-lg"
            >
              {deleteState.error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="danger" size="sm" disabled={deletePending}>
              {deletePending ? 'Deleting workspace…' : 'Confirm Delete'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deletePending}
              onClick={() => setMode('idle')}
            >
              Keep Workspace
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
