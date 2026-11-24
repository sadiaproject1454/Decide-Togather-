// DecisionCard — a card shown in lists of decisions
// Receives a Decision object as a prop and renders a summary card

import React from 'react';
import Link from 'next/link';
import { Decision, getLeadingOption } from '@/app/lib/data';
import { StatusBadge } from './Badge';

interface DecisionCardProps {
  decision: Decision;
}

export default function DecisionCard({ decision }: DecisionCardProps) {
  const leading = getLeadingOption(decision);
  const totalVotes = decision.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <Link
      href={`/decisions/${decision.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 transition-all duration-150 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 leading-snug">
          {decision.title}
        </h3>
        <StatusBadge status={decision.status} />
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">
        {decision.description}
      </p>

      {/* Leading option */}
      {leading && totalVotes > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Leading: <span className="font-medium text-gray-700">{leading.label}</span></span>
            <span className="text-xs text-gray-400">{leading.votes}/{totalVotes} votes</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${totalVotes > 0 ? (leading.votes / totalVotes) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{decision.options.length} options</span>
        <span>Deadline: {new Date(decision.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </Link>
  );
}
