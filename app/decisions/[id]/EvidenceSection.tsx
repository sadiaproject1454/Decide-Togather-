'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import {
  createEvidenceAction,
  deleteEvidenceAction,
  updateEvidenceAction,
} from '@/app/actions/evidence';
import Button from '@/app/components/Button';
import type { EvidenceItem } from '@/app/lib/types';

interface EvidenceSectionProps {
  decisionId: number;
  workspaceId: number;
  evidence: EvidenceItem[];
}

function validateEvidenceClient(title: string, description: string, sourceUrl: string): string | null {
  const trimmedTitle = title.trim();
  const trimmedDesc = description.trim();
  const trimmedUrl = sourceUrl.trim();

  if (trimmedTitle.length < 2) {
    return 'Evidence title must be at least 2 characters.';
  }
  if (trimmedTitle.length > 200) {
    return 'Evidence title must be 200 characters or fewer.';
  }
  if (trimmedDesc.length > 2000) {
    return 'Description must be 2000 characters or fewer.';
  }
  if (trimmedUrl) {
    if (trimmedUrl.length > 500) {
      return 'Source URL must be 500 characters or fewer.';
    }
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'Source URL must start with http:// or https://.';
      }
    } catch {
      return 'Please enter a valid URL (e.g. https://example.com/report).';
    }
  }
  return null;
}

function getSafeHref(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function EvidenceCard({
  item,
  decisionId,
  onRequestDelete,
}: {
  item: EvidenceItem;
  decisionId: number;
  onRequestDelete: (item: EvidenceItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [clientError, setClientError] = useState('');
  const [editState, editAction, editPending] = useActionState(updateEvidenceAction, undefined);

  const safeHref = getSafeHref(item.source_url);
  const errorMessage = clientError || editState?.error;

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const err = validateEvidenceClient(
      String(formData.get('title') ?? ''),
      String(formData.get('description') ?? ''),
      String(formData.get('sourceUrl') ?? '')
    );
    if (err) {
      e.preventDefault();
      setClientError(err);
      return;
    }
    setClientError('');
  }

  return (
    <li className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5">
      {!editing ? (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 break-words">{item.title}</h3>

            {item.canManage && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setClientError('');
                    setEditing(true);
                  }}
                  aria-label={`Edit evidence ${item.title}`}
                  className="text-xs font-medium text-gray-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:border-indigo-200 transition-colors cursor-pointer"
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(item)}
                  aria-label={`Delete evidence ${item.title}`}
                  className="text-xs font-medium text-red-600 hover:text-red-700 px-2.5 py-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition-colors cursor-pointer"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words">
              {item.description}
            </p>
          )}

          {safeHref && (
            <div>
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 underline break-all"
              >
                <span>🔗</span>
                <span>{safeHref}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 pt-1">
            <span>👤 Added by {item.creatorName}</span>
            <span>
              📅{' '}
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      ) : (
        <form
          key={`${item.id}-${item.updated_at}`}
          action={editAction}
          onSubmit={handleEditSubmit}
          noValidate
          className="space-y-3 bg-white border border-gray-200 rounded-xl p-4"
        >
          <input type="hidden" name="evidenceId" value={item.id} />
          <input type="hidden" name="decisionId" value={decisionId} />

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Edit Evidence</h4>
            <button
              type="button"
              onClick={() => {
                setClientError('');
                setEditing(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg"
            >
              {errorMessage}
            </div>
          )}

          {editState?.success && !clientError && (
            <div
              role="status"
              className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg"
            >
              ✅ {editState.success}
            </div>
          )}

          <div>
            <label
              htmlFor={`ev-edit-title-${item.id}`}
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id={`ev-edit-title-${item.id}`}
              name="title"
              type="text"
              required
              aria-required="true"
              maxLength={200}
              defaultValue={item.title}
              onChange={() => {
                if (clientError) setClientError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor={`ev-edit-desc-${item.id}`}
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Description (optional)
            </label>
            <textarea
              id={`ev-edit-desc-${item.id}`}
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={item.description ?? ''}
              onChange={() => {
                if (clientError) setClientError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label
              htmlFor={`ev-edit-url-${item.id}`}
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Source URL (optional)
            </label>
            <input
              id={`ev-edit-url-${item.id}`}
              name="sourceUrl"
              type="url"
              maxLength={500}
              defaultValue={item.source_url ?? ''}
              placeholder="https://example.com/benchmark"
              onChange={() => {
                if (clientError) setClientError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="submit" size="sm" disabled={editPending}>
              {editPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={editPending}
              onClick={() => {
                setClientError('');
                setEditing(false);
              }}
            >
              Done
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}

export default function EvidenceSection({
  decisionId,
  workspaceId,
  evidence,
}: EvidenceSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addClientError, setAddClientError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EvidenceItem | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deletePending, startDeleteTransition] = useTransition();

  const [addState, addAction, addPending] = useActionState(createEvidenceAction, undefined);

  const addFormRef = useRef<HTMLFormElement>(null);
  const lastAddActionId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (addState?.success && addState.actionId && addState.actionId !== lastAddActionId.current) {
      lastAddActionId.current = addState.actionId;
      addFormRef.current?.reset();
    }
  }, [addState]);

  useEffect(() => {
    if (!deleteTarget) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deletePending) {
        setDeleteTarget(null);
        setDeleteError('');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTarget, deletePending]);

  function handleConfirmDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!deleteTarget || deletePending) return;
    setDeleteError('');
    setDeleteSuccess('');

    const formData = new FormData(e.currentTarget);
    startDeleteTransition(async () => {
      const res = await deleteEvidenceAction(undefined, formData);
      if (res?.error) {
        setDeleteError(res.error);
        return;
      }
      setDeleteTarget(null);
      setDeleteSuccess(res?.success ?? 'Evidence deleted successfully.');
    });
  }

  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const err = validateEvidenceClient(
      String(formData.get('title') ?? ''),
      String(formData.get('description') ?? ''),
      String(formData.get('sourceUrl') ?? '')
    );
    if (err) {
      e.preventDefault();
      setAddClientError(err);
      return;
    }
    setAddClientError('');
  }

  const addErrorMessage = addClientError || addState?.error;

  return (
    <section
      aria-labelledby="evidence-section-heading"
      className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="evidence-section-heading" className="font-semibold text-gray-900">
            📚 Supporting Evidence ({evidence.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Share research, links, and context to inform this decision.
          </p>
        </div>

        <Button
          variant={showAddForm ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => {
            setAddClientError('');
            setShowAddForm((prev) => !prev);
          }}
        >
          {showAddForm ? 'Close Form' : '+ Add Evidence'}
        </Button>
      </div>

      {/* Delete success feedback */}
      {deleteSuccess && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 text-xs px-3.5 py-2.5 rounded-lg"
        >
          ✅ {deleteSuccess}
        </div>
      )}

      {/* Add Evidence Form */}
      {showAddForm && (
        <form
          ref={addFormRef}
          action={addAction}
          onSubmit={handleAddSubmit}
          noValidate
          className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4"
        >
          <input type="hidden" name="decisionId" value={decisionId} />
          <input type="hidden" name="workspaceId" value={workspaceId} />

          <h3 className="text-sm font-semibold text-gray-900">Add New Evidence</h3>

          {addErrorMessage && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg"
            >
              {addErrorMessage}
            </div>
          )}

          {addState?.success && !addClientError && (
            <div
              role="status"
              className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg"
            >
              ✅ {addState.success}
            </div>
          )}

          <div>
            <label htmlFor="ev-add-title" className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="ev-add-title"
              name="title"
              type="text"
              required
              aria-required="true"
              maxLength={200}
              onChange={() => {
                if (addClientError) setAddClientError('');
              }}
              placeholder="e.g. Q3 Performance Benchmark Report"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="ev-add-desc" className="block text-xs font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="ev-add-desc"
              name="description"
              rows={3}
              maxLength={2000}
              onChange={() => {
                if (addClientError) setAddClientError('');
              }}
              placeholder="Summarize key findings or why this matters..."
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label htmlFor="ev-add-url" className="block text-xs font-medium text-gray-700 mb-1">
              Source URL (optional)
            </label>
            <input
              id="ev-add-url"
              name="sourceUrl"
              type="url"
              maxLength={500}
              onChange={() => {
                if (addClientError) setAddClientError('');
              }}
              placeholder="https://example.com/research"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={addPending}>
              {addPending ? 'Adding evidence…' : 'Save Evidence'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={addPending}
              onClick={() => {
                setAddClientError('');
                setShowAddForm(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Evidence List or Empty State */}
      {evidence.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg mx-auto mb-3">
            📎
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No evidence added yet</p>
          <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
            Add links, notes, or research findings to support this decision.
          </p>
          {!showAddForm && (
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
              + Add first evidence
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {evidence.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              decisionId={decisionId}
              onRequestDelete={(target) => {
                setDeleteError('');
                setDeleteSuccess('');
                setDeleteTarget(target);
              }}
            />
          ))}
        </ul>
      )}

      {/* Accessible Confirmation Dialog for Deletion */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-evidence-dialog-title"
        >
          <form
            onSubmit={handleConfirmDelete}
            className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <input type="hidden" name="evidenceId" value={deleteTarget.id} />
            <input type="hidden" name="decisionId" value={decisionId} />

            <div>
              <h3 id="delete-evidence-dialog-title" className="text-base font-bold text-gray-900">
                Delete Evidence?
              </h3>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-gray-900">&ldquo;{deleteTarget.title}&rdquo;</strong>? This
                action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg"
              >
                {deleteError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deletePending}
                onClick={() => {
                  setDeleteError('');
                  setDeleteTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" disabled={deletePending}>
                {deletePending ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
