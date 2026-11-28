'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import {
  createOptionPointAction,
  deleteOptionPointAction,
  updateOptionPointAction,
} from '@/app/actions/option-points';
import Button from '@/app/components/Button';
import type { DecisionOptionPointItem, OptionPointType } from '@/app/lib/types';

interface OptionPointsSectionProps {
  decisionId: number;
  optionId: number;
  optionLabel: string;
  workspaceId: number;
  points: DecisionOptionPointItem[];
}

function validatePointClient(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length < 2) {
    return 'Point content must be at least 2 characters.';
  }
  if (trimmed.length > 500) {
    return 'Point content must be 500 characters or fewer.';
  }
  return null;
}

function EditPointForm({
  point,
  decisionId,
  onClose,
}: {
  point: DecisionOptionPointItem;
  decisionId: number;
  onClose: () => void;
}) {
  const [clientError, setClientError] = useState('');
  const [editState, editAction, editPending] = useActionState(updateOptionPointAction, undefined);

  const errorMessage = clientError || editState?.error;
  const isPro = point.type === 'pro';

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const err = validatePointClient(String(formData.get('content') ?? ''));
    if (err) {
      e.preventDefault();
      setClientError(err);
      return;
    }
    setClientError('');
  }

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-3">
      <form
        key={`${point.id}-${point.updated_at}`}
        action={editAction}
        onSubmit={handleEditSubmit}
        noValidate
        className="space-y-2.5"
      >
        <input type="hidden" name="pointId" value={point.id} />
        <input type="hidden" name="decisionId" value={decisionId} />

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">
            Edit {isPro ? 'Pro' : 'Con'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1.5 rounded-md"
          >
            {errorMessage}
          </div>
        )}

        {editState?.success && !clientError && (
          <div
            role="status"
            className="bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-1.5 rounded-md"
          >
            ✅ {editState.success}
          </div>
        )}

        <div>
          <label htmlFor={`point-edit-${point.id}`} className="sr-only">
            Edit {isPro ? 'Pro' : 'Con'} content
          </label>
          <textarea
            id={`point-edit-${point.id}`}
            name="content"
            rows={2}
            required
            aria-required="true"
            maxLength={500}
            defaultValue={point.content}
            onChange={() => {
              if (clientError) setClientError('');
            }}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={editPending}>
            {editPending ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={editPending} onClick={onClose}>
            Done
          </Button>
        </div>
      </form>
    </li>
  );
}

function PointRow({
  point,
  decisionId,
  onRequestDelete,
}: {
  point: DecisionOptionPointItem;
  decisionId: number;
  onRequestDelete: (point: DecisionOptionPointItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const isPro = point.type === 'pro';

  if (editing) {
    return (
      <EditPointForm
        point={point}
        decisionId={decisionId}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <li
      className={`rounded-lg border p-3 ${
        isPro ? 'border-emerald-200/80 bg-emerald-50/40' : 'border-rose-200/80 bg-rose-50/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed break-words min-w-0 flex-1">
          {point.content}
        </p>

        {point.canManage && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${isPro ? 'pro' : 'con'} ${point.content}`}
              className="text-[11px] font-medium text-gray-600 hover:text-indigo-600 px-2 py-0.5 rounded border border-gray-200 bg-white hover:border-indigo-200 transition-colors cursor-pointer"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(point)}
              aria-label={`Delete ${isPro ? 'pro' : 'con'} ${point.content}`}
              className="text-[11px] font-medium text-red-600 hover:text-red-700 px-2 py-0.5 rounded border border-red-200 bg-white hover:bg-red-50 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
        <span>👤 {point.creatorName}</span>
        <span>
          📅{' '}
          {new Date(point.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </li>
  );
}

function AddPointForm({
  type,
  decisionId,
  optionId,
  workspaceId,
}: {
  type: OptionPointType;
  decisionId: number;
  optionId: number;
  workspaceId: number;
}) {
  const [clientError, setClientError] = useState('');
  const [addState, addAction, addPending] = useActionState(createOptionPointAction, undefined);

  const formRef = useRef<HTMLFormElement>(null);
  const lastActionId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (addState?.success && addState.actionId && addState.actionId !== lastActionId.current) {
      lastActionId.current = addState.actionId;
      formRef.current?.reset();
    }
  }, [addState]);

  const isPro = type === 'pro';
  const errorMessage = clientError || addState?.error;

  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const err = validatePointClient(String(formData.get('content') ?? ''));
    if (err) {
      e.preventDefault();
      setClientError(err);
      return;
    }
    setClientError('');
  }

  return (
    <form
      ref={formRef}
      action={addAction}
      onSubmit={handleAddSubmit}
      noValidate
      className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2.5"
    >
      <input type="hidden" name="decisionId" value={decisionId} />
      <input type="hidden" name="optionId" value={optionId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="type" value={type} />

      {errorMessage && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1.5 rounded-md"
        >
          {errorMessage}
        </div>
      )}

      {addState?.success && !clientError && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-1.5 rounded-md"
        >
          ✅ {addState.success}
        </div>
      )}

      <div>
        <label
          htmlFor={`add-${type}-${optionId}`}
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          {isPro ? 'Positive point' : 'Negative point'} <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`add-${type}-${optionId}`}
          name="content"
          rows={2}
          required
          aria-required="true"
          maxLength={500}
          onChange={() => {
            if (clientError) setClientError('');
          }}
          placeholder={isPro ? 'e.g. Good battery life' : 'e.g. Limited storage'}
          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={addPending}>
          {addPending ? 'Adding…' : isPro ? 'Save Pro' : 'Save Con'}
        </Button>
      </div>
    </form>
  );
}

function PointColumn({
  type,
  decisionId,
  optionId,
  optionLabel,
  workspaceId,
  items,
  onRequestDelete,
}: {
  type: OptionPointType;
  decisionId: number;
  optionId: number;
  optionLabel: string;
  workspaceId: number;
  items: DecisionOptionPointItem[];
  onRequestDelete: (point: DecisionOptionPointItem) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const isPro = type === 'pro';
  const heading = isPro ? 'Pros' : 'Cons';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 text-gray-800">
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
              isPro ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isPro ? '+' : '−'}
          </span>
          <span>
            {heading} ({items.length})
          </span>
        </h3>

        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          aria-expanded={showAdd}
          aria-label={isPro ? `Add Pro for ${optionLabel}` : `Add Con for ${optionLabel}`}
          className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
            isPro
              ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              : 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
          }`}
        >
          {showAdd ? 'Cancel' : isPro ? '+ Add Pro' : '+ Add Con'}
        </button>
      </div>

      {showAdd && (
        <AddPointForm
          type={type}
          decisionId={decisionId}
          optionId={optionId}
          workspaceId={workspaceId}
        />
      )}

      {items.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-3.5 text-center text-xs text-gray-400">
          No {isPro ? 'pros' : 'cons'} added yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((point) => (
            <PointRow
              key={point.id}
              point={point}
              decisionId={decisionId}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OptionPointsSection({
  decisionId,
  optionId,
  optionLabel,
  workspaceId,
  points,
}: OptionPointsSectionProps) {
  const [deleteTarget, setDeleteTarget] = useState<DecisionOptionPointItem | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deletePending, startDeleteTransition] = useTransition();

  const pros = points.filter((p) => p.type === 'pro');
  const cons = points.filter((p) => p.type === 'con');

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
      const res = await deleteOptionPointAction(undefined, formData);
      if (res?.error) {
        setDeleteError(res.error);
        return;
      }
      setDeleteTarget(null);
      setDeleteSuccess(res?.success ?? 'Point deleted successfully.');
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {deleteSuccess && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg"
        >
          ✅ {deleteSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <PointColumn
          type="pro"
          decisionId={decisionId}
          optionId={optionId}
          optionLabel={optionLabel}
          workspaceId={workspaceId}
          items={pros}
          onRequestDelete={(target) => {
            setDeleteError('');
            setDeleteSuccess('');
            setDeleteTarget(target);
          }}
        />
        <PointColumn
          type="con"
          decisionId={decisionId}
          optionId={optionId}
          optionLabel={optionLabel}
          workspaceId={workspaceId}
          items={cons}
          onRequestDelete={(target) => {
            setDeleteError('');
            setDeleteSuccess('');
            setDeleteTarget(target);
          }}
        />
      </div>

      {/* Accessible Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-point-title-${optionId}`}
        >
          <form
            onSubmit={handleConfirmDelete}
            className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <input type="hidden" name="pointId" value={deleteTarget.id} />
            <input type="hidden" name="decisionId" value={decisionId} />

            <div>
              <h3
                id={`delete-point-title-${optionId}`}
                className="text-base font-bold text-gray-900"
              >
                Delete {deleteTarget.type === 'pro' ? 'Pro' : 'Con'}?
              </h3>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-gray-900">&ldquo;{deleteTarget.content}&rdquo;</strong>?
                This action cannot be undone.
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
    </div>
  );
}
