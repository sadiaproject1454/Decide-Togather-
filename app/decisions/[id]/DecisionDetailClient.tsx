'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { deleteDecisionAction, updateDecisionAction } from '@/app/actions/decisions';
import { StatusBadge } from '@/app/components/Badge';
import Button from '@/app/components/Button';
import type { DecisionItem, DecisionStatus, EvidenceItem } from '@/app/lib/types';
import EvidenceSection from './EvidenceSection';

interface Props {
  decision: DecisionItem;
  workspaceName: string;
  creatorName: string;
  canManage: boolean;
  evidence: EvidenceItem[];
}

interface EditableOption {
  id: number | null;
  label: string;
}

function formatDateInputValue(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function DecisionDetailClient({
  decision,
  workspaceName,
  creatorName,
  canManage,
  evidence,
}: Props) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [clientError, setClientError] = useState('');
  const [editOptions, setEditOptions] = useState<EditableOption[]>(() =>
    decision.options.length >= 2
      ? decision.options.map((o) => ({ id: o.id, label: o.label }))
      : [
          ...decision.options.map((o) => ({ id: o.id, label: o.label })),
          ...Array.from({ length: Math.max(0, 2 - decision.options.length) }, () => ({
            id: null,
            label: '',
          })),
        ]
  );

  const [editState, editAction, editPending] = useActionState(updateDecisionAction, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteDecisionAction, undefined);

  function openEditMode() {
    setEditOptions(
      decision.options.length >= 2
        ? decision.options.map((o) => ({ id: o.id, label: o.label }))
        : [
            ...decision.options.map((o) => ({ id: o.id, label: o.label })),
            ...Array.from({ length: Math.max(0, 2 - decision.options.length) }, () => ({
              id: null,
              label: '',
            })),
          ]
    );
    setClientError('');
    setMode('edit');
  }

  function addEditOption() {
    if (editOptions.length < 8) {
      setEditOptions([...editOptions, { id: null, label: '' }]);
      if (clientError) setClientError('');
    }
  }

  function updateEditOption(index: number, label: string) {
    const next = [...editOptions];
    next[index] = { ...next[index], label };
    setEditOptions(next);
    if (clientError) setClientError('');
  }

  function removeEditOption(index: number) {
    if (editOptions.length > 2) {
      setEditOptions(editOptions.filter((_, i) => i !== index));
      if (clientError) setClientError('');
    }
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const cleanedOptions = editOptions.map((o) => o.label.trim()).filter(Boolean);

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
      setClientError('Please keep at least 2 non-empty options.');
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

  const editError = clientError || editState?.error;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-gray-600">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/workspaces" className="hover:text-gray-600">
          Workspaces
        </Link>
        <span>/</span>
        <Link href={`/workspaces/${decision.workspace_id}`} className="hover:text-gray-600">
          {workspaceName}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{decision.title}</span>
      </nav>

      {/* Decision Header Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
            {decision.title}
          </h1>
          <StatusBadge status={decision.status} />
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-5 whitespace-pre-line">
          {decision.description || 'No description provided.'}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400 pt-4 border-t border-gray-100">
          <span className="flex items-center gap-1">
            🏢{' '}
            <Link
              href={`/workspaces/${decision.workspace_id}`}
              className="hover:text-indigo-600 font-medium text-gray-600"
            >
              {workspaceName}
            </Link>
          </span>
          <span>👤 Created by {creatorName}</span>
          <span>
            📅 Created{' '}
            {new Date(decision.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          {decision.deadline && (
            <span>
              ⏰ Deadline{' '}
              {new Date(decision.deadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Manage Buttons (Creator or Workspace Admin) */}
      {canManage && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={mode === 'edit' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                if (mode === 'edit') {
                  setMode('view');
                  setClientError('');
                } else {
                  openEditMode();
                }
              }}
            >
              ✏️ {mode === 'edit' ? 'Close Editor' : 'Edit Decision'}
            </Button>

            <Button
              variant={mode === 'delete' ? 'danger' : 'outline'}
              size="sm"
              onClick={() => {
                setClientError('');
                setMode(mode === 'delete' ? 'view' : 'delete');
              }}
            >
              🗑️ {mode === 'delete' ? 'Cancel Delete' : 'Delete Decision'}
            </Button>
          </div>

          {editState?.success && mode === 'edit' && !clientError && (
            <div
              role="status"
              className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl"
            >
              ✅ {editState.success}
            </div>
          )}

          {/* Delete Confirmation Panel */}
          {mode === 'delete' && (
            <form
              action={deleteAction}
              className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4"
            >
              <input type="hidden" name="decisionId" value={decision.id} />
              <div>
                <h2 className="text-base font-semibold text-red-900">
                  Delete &ldquo;{decision.title}&rdquo;?
                </h2>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  This permanently deletes this decision and its{' '}
                  <strong>{decision.options.length}</strong> option
                  {decision.options.length === 1 ? '' : 's'}. This action cannot be undone.
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
                  {deletePending ? 'Deleting decision…' : 'Confirm Delete'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletePending}
                  onClick={() => setMode('view')}
                >
                  Keep Decision
                </Button>
              </div>
            </form>
          )}

          {/* Edit Decision & Options Form */}
          {mode === 'edit' && (
            <form
              key={`${decision.id}-${decision.title}-${decision.status}-${decision.deadline ?? ''}`}
              action={editAction}
              onSubmit={handleEditSubmit}
              noValidate
              className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-5"
            >
              <input type="hidden" name="decisionId" value={decision.id} />

              <div>
                <h2 className="text-base font-semibold text-gray-900">Edit Decision &amp; Options</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update the decision details or modify its options in PostgreSQL.
                </p>
              </div>

              {editError && (
                <div
                  role="alert"
                  className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg"
                >
                  {editError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Decision title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-title"
                    name="title"
                    type="text"
                    required
                    maxLength={120}
                    defaultValue={decision.title}
                    onChange={() => {
                      if (clientError) setClientError('');
                    }}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    rows={3}
                    maxLength={2000}
                    defaultValue={decision.description}
                    onChange={() => {
                      if (clientError) setClientError('');
                    }}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="edit-status"
                      name="status"
                      defaultValue={decision.status as DecisionStatus}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="open">Open</option>
                      <option value="voting">Voting</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-deadline" className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline (optional)
                    </label>
                    <input
                      id="edit-deadline"
                      name="deadline"
                      type="date"
                      defaultValue={formatDateInputValue(decision.deadline)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Options ({editOptions.length}/8)
                  </label>
                  <span className="text-xs text-gray-400">Minimum 2 options</span>
                </div>

                <div className="space-y-2.5">
                  {editOptions.map((opt, idx) => (
                    <div key={opt.id ?? `new-${idx}`} className="flex items-center gap-2">
                      <input type="hidden" name="optionIds" value={opt.id ?? ''} />
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        name="optionLabels"
                        type="text"
                        required={idx < 2}
                        maxLength={120}
                        value={opt.label}
                        onChange={(e) => updateEditOption(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {editOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEditOption(idx)}
                          className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-lg leading-none cursor-pointer"
                          title="Remove option"
                          aria-label={`Remove option ${idx + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {editOptions.length < 8 && (
                  <button
                    type="button"
                    onClick={addEditOption}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                  >
                    + Add option
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" size="sm" disabled={editPending}>
                  {editPending ? 'Saving changes…' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClientError('');
                    setMode('view');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Options & Evidence */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Decision Options ({decision.options.length})
              </h2>
            </div>

            {decision.options.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
                No options found for this decision.
              </div>
            ) : (
              <ul className="space-y-3">
                {decision.options.map((option, index) => (
                  <li
                    key={option.id}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50"
                  >
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 break-words">
                      {option.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <EvidenceSection
            decisionId={decision.id}
            workspaceId={decision.workspace_id}
            evidence={evidence}
          />
        </div>

        {/* Navigation / Metadata Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2.5">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Quick Navigation</h3>
            <Button
              href={`/decisions/new?workspaceId=${decision.workspace_id}`}
              variant="outline"
              size="sm"
              fullWidth
            >
              + New Decision
            </Button>
            <Button
              href={`/workspaces/${decision.workspace_id}`}
              variant="secondary"
              size="sm"
              fullWidth
            >
              ← Back to {workspaceName}
            </Button>
            <Button href="/decisions" variant="ghost" size="sm" fullWidth>
              View All Decisions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
