'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import {
  addWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateMemberRoleAction,
} from '@/app/actions/members';
import { Badge } from '@/app/components/Badge';
import Button from '@/app/components/Button';
import { getInitials, type WorkspaceMemberItem, type WorkspaceRole } from '@/app/lib/types';

interface WorkspaceMembersPanelProps {
  workspaceId: number;
  workspaceName: string;
  currentUserId: string;
  isAdmin: boolean;
  members: WorkspaceMemberItem[];
}

function validateEmailClient(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  if (trimmed.length > 254) {
    return 'Email address must be 254 characters or fewer.';
  }
  return null;
}

function AddMemberForm({
  workspaceId,
  onClose,
}: {
  workspaceId: number;
  onClose: () => void;
}) {
  const [clientError, setClientError] = useState('');
  const [state, formAction, pending] = useActionState(addWorkspaceMemberAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const lastActionId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state?.success && state.actionId && state.actionId !== lastActionId.current) {
      lastActionId.current = state.actionId;
      formRef.current?.reset();
    }
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const err = validateEmailClient(String(formData.get('email') ?? ''));
    if (err) {
      e.preventDefault();
      setClientError(err);
      return;
    }
    setClientError('');
  }

  const errorMessage = clientError || state?.error;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
          Add Existing User
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Add a teammate who already has a Decide Together account by entering their email.
      </p>

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
          className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg"
        >
          ✅ {state.success}
        </div>
      )}

      <div>
        <label htmlFor="add-member-email" className="block text-xs font-medium text-gray-700 mb-1">
          User email <span className="text-red-500">*</span>
        </label>
        <input
          id="add-member-email"
          name="email"
          type="email"
          required
          aria-required="true"
          maxLength={254}
          onChange={() => {
            if (clientError) setClientError('');
          }}
          placeholder="teammate@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="add-member-role" className="block text-xs font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          id="add-member-role"
          name="role"
          defaultValue="member"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="member">Member (collaborate on decisions)</option>
          <option value="admin">Admin (manage workspace &amp; members)</option>
        </select>
      </div>

      <Button type="submit" size="sm" fullWidth disabled={pending}>
        {pending ? 'Adding member…' : 'Add Member'}
      </Button>
    </form>
  );
}

export default function WorkspaceMembersPanel({
  workspaceId,
  workspaceName,
  currentUserId,
  isAdmin,
  members,
}: WorkspaceMembersPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [activeMemberId, setActiveMemberId] = useState<number | null>(null);
  const [rolePending, startRoleTransition] = useTransition();

  const [removeTarget, setRemoveTarget] = useState<WorkspaceMemberItem | null>(null);
  const [removeError, setRemoveError] = useState('');
  const [removePending, startRemoveTransition] = useTransition();

  useEffect(() => {
    if (!removeTarget) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !removePending) {
        setRemoveTarget(null);
        setRemoveError('');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [removeTarget, removePending]);

  function handleRoleChange(member: WorkspaceMemberItem, nextRole: WorkspaceRole) {
    if (rolePending) return;
    setFeedback(null);
    setActiveMemberId(member.id);

    const formData = new FormData();
    formData.set('workspaceId', String(workspaceId));
    formData.set('memberId', String(member.id));
    formData.set('role', nextRole);

    startRoleTransition(async () => {
      const res = await updateMemberRoleAction(undefined, formData);
      setActiveMemberId(null);
      if (res?.error) {
        setFeedback({ type: 'error', text: res.error });
        return;
      }
      setFeedback({
        type: 'success',
        text: res?.success ?? `Updated role to ${nextRole}.`,
      });
    });
  }

  function handleConfirmRemove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!removeTarget || removePending) return;
    setRemoveError('');
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    startRemoveTransition(async () => {
      const res = await removeWorkspaceMemberAction(undefined, formData);
      if (res?.error) {
        setRemoveError(res.error);
        return;
      }
      setRemoveTarget(null);
      setFeedback({
        type: 'success',
        text: res?.success ?? 'Member removed from workspace.',
      });
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold text-gray-900">Members ({members.length})</h2>
        {isAdmin && (
          <Button
            variant={showAddForm ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              setFeedback(null);
              setShowAddForm((prev) => !prev);
            }}
          >
            {showAddForm ? 'Close' : '+ Add Member'}
          </Button>
        )}
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mb-4 text-xs px-3 py-2.5 rounded-lg border ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          {feedback.type === 'success' ? `✅ ${feedback.text}` : feedback.text}
        </div>
      )}

      {showAddForm && isAdmin && (
        <AddMemberForm workspaceId={workspaceId} onClose={() => setShowAddForm(false)} />
      )}

      {members.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
          No members found in this workspace.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {members.map((member) => {
            const name = member.user.full_name?.trim() || member.user.email || 'Member';
            const isSelf = member.user_id === currentUserId;
            const isOwner = Boolean(member.isOwner);
            const canAdminManageTarget = isAdmin && !isOwner && !isSelf;
            const canSelfLeave = isSelf && !isOwner;
            const nextRole: WorkspaceRole = member.role === 'admin' ? 'member' : 'admin';
            const isUpdatingThis = rolePending && activeMemberId === member.id;

            return (
              <div key={member.id} className="p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                      {isSelf && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                  </div>
                  <Badge
                    label={isOwner ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                    color={isOwner || member.role === 'admin' ? 'indigo' : 'gray'}
                  />
                </div>

                {(canAdminManageTarget || canSelfLeave) && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {canAdminManageTarget && (
                      <>
                        <button
                          type="button"
                          disabled={rolePending}
                          onClick={() => handleRoleChange(member, nextRole)}
                          className="text-[11px] font-medium text-gray-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:border-indigo-200 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isUpdatingThis
                            ? 'Updating…'
                            : member.role === 'admin'
                              ? 'Make Member'
                              : 'Make Admin'}
                        </button>
                        <button
                          type="button"
                          disabled={rolePending || removePending}
                          onClick={() => {
                            setRemoveError('');
                            setRemoveTarget(member);
                          }}
                          className="text-[11px] font-medium text-red-600 hover:text-red-700 px-2.5 py-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </>
                    )}

                    {canSelfLeave && (
                      <button
                        type="button"
                        disabled={removePending}
                        onClick={() => {
                          setRemoveError('');
                          setRemoveTarget(member);
                        }}
                        className="text-[11px] font-medium text-red-600 hover:text-red-700 px-2.5 py-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Leave Workspace
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Remove Member / Leave Workspace */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-member-dialog-title"
        >
          <form
            onSubmit={handleConfirmRemove}
            className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="memberId" value={removeTarget.id} />

            <div>
              <h3 id="remove-member-dialog-title" className="text-base font-bold text-gray-900">
                {removeTarget.user_id === currentUserId
                  ? `Leave "${workspaceName}"?`
                  : 'Remove Workspace Member?'}
              </h3>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                {removeTarget.user_id === currentUserId ? (
                  <>
                    You will lose access to <strong className="text-gray-900">{workspaceName}</strong>{' '}
                    and its decisions until an admin adds you again.
                  </>
                ) : (
                  <>
                    Remove{' '}
                    <strong className="text-gray-900">
                      {removeTarget.user.full_name?.trim() || removeTarget.user.email}
                    </strong>{' '}
                    from <strong className="text-gray-900">{workspaceName}</strong>? They will
                    immediately lose access to this workspace and its decisions.
                  </>
                )}
              </p>
            </div>

            {removeError && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg"
              >
                {removeError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={removePending}
                onClick={() => {
                  setRemoveError('');
                  setRemoveTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" disabled={removePending}>
                {removePending
                  ? removeTarget.user_id === currentUserId
                    ? 'Leaving…'
                    : 'Removing…'
                  : removeTarget.user_id === currentUserId
                    ? 'Leave Workspace'
                    : 'Confirm Remove'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
