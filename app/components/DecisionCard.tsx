import React from 'react';
import Link from 'next/link';
import type { DecisionItem } from '@/app/lib/types';
import { StatusBadge } from './Badge';

interface DecisionCardProps {
  decision: DecisionItem;
}

export default function DecisionCard({ decision }: DecisionCardProps) {
  return (
    <Link
      href={`/decisions/${decision.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 leading-snug">
          {decision.title}
        </h3>
        <StatusBadge status={decision.status} />
      </div>

      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 min-h-[2.25rem]">
        {decision.description || 'No description provided.'}
      </p>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>
          {decision.options.length} option{decision.options.length === 1 ? '' : 's'}
        </span>
        <span>
          {decision.deadline
            ? `Deadline: ${new Date(decision.deadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}`
            : `Created ${new Date(decision.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}`}
        </span>
      </div>
    </Link>
  );
}
