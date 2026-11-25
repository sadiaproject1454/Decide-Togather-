'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { voteOptionAction } from '@/app/actions/decisions';
import { StatusBadge } from '@/app/components/Badge';
import Button from '@/app/components/Button';
import type { DecisionItem, DecisionOptionItem } from '@/app/lib/types';

interface Props {
  decision: DecisionItem;
  workspaceName: string;
}

export default function DecisionDetailClient({ decision, workspaceName }: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [localOptions, setLocalOptions] = useState<DecisionOptionItem[]>(decision.options);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const totalVotes = localOptions.reduce((sum, o) => sum + o.votes, 0);

  function handleVote() {
    if (!selectedOption || hasVoted || isPending) return;
    setError('');
    const chosenId = selectedOption;

    startTransition(async () => {
      const res = await voteOptionAction(chosenId, decision.id);
      if (res?.error) {
        setError(res.error);
        return;
      }

      setLocalOptions((prev) =>
        prev.map((o) =>
          o.id === chosenId
            ? { ...o, votes: typeof res?.votes === 'number' ? res.votes : o.votes + 1 }
            : o
        )
      );
      setHasVoted(true);
    });
  }

  const winner = [...localOptions].sort((a, b) => b.votes - a.votes)[0];
  const isOpen = decision.status !== 'closed';

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-gray-600">
          Dashboard
        </Link>
        <span>/</span>
        <Link href={`/workspaces/${decision.workspace_id}`} className="hover:text-gray-600">
          {workspaceName}
        </Link>
        <span>/</span>
        <span className="text-gray-600 font-medium truncate max-w-xs">{decision.title}</span>
      </nav>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{decision.title}</h1>
          <StatusBadge status={decision.status} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {decision.description || 'No additional description provided.'}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            🏢{' '}
            <Link href={`/workspaces/${decision.workspace_id}`} className="hover:text-indigo-600">
              {workspaceName}
            </Link>
          </span>
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
          <span>👥 {totalVotes} votes cast</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Cast your vote</h2>
            <p className="text-xs text-gray-400 mb-5">
              {hasVoted
                ? 'Your vote has been saved to PostgreSQL. ✅'
                : isOpen
                ? 'Select an option and confirm your vote.'
                : 'This decision is closed.'}
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {localOptions.map((option) => {
                const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                const isLeading = option.id === winner?.id && totalVotes > 0;
                const isSelected = selectedOption === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!isOpen || hasVoted || isPending}
                    onClick={() => setSelectedOption(option.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${!isOpen || hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        {isLeading && hasVoted && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Leading
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {option.votes} votes ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isLeading && hasVoted ? 'bg-yellow-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {isOpen && !hasVoted && (
              <Button onClick={handleVote} disabled={!selectedOption || isPending} fullWidth>
                {isPending ? 'Saving vote…' : 'Confirm Vote'}
              </Button>
            )}

            {hasVoted && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg text-center">
                ✅ You voted for{' '}
                <strong>{localOptions.find((o) => o.id === selectedOption)?.label}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">📊 Current Results</h3>
            <div className="space-y-2">
              {[...localOptions]
                .sort((a, b) => b.votes - a.votes)
                .map((option, rank) => (
                  <div key={option.id} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400 w-4">{rank + 1}.</span>
                    <span className="flex-1 text-gray-700 truncate">{option.label}</span>
                    <span className="font-semibold text-gray-900">{option.votes}</span>
                  </div>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
              Total votes: {totalVotes}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Actions</h3>
            <Button href="/decisions/new" variant="outline" size="sm" fullWidth>
              + New Decision
            </Button>
            <Button href="/dashboard" variant="ghost" size="sm" fullWidth>
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
