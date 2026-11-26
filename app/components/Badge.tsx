// Badge component — shows a colored label for decision status
// Usage: <Badge status="open" /> or <Badge label="Admin" color="purple" />

import React from 'react';
import { DecisionStatus } from '@/app/lib/types';

interface StatusBadgeProps {
  status: DecisionStatus;
}

const statusConfig: Record<DecisionStatus, { label: string; classes: string }> = {
  open:   { label: 'Open',   classes: 'bg-green-100 text-green-700' },
  voting: { label: 'Voting', classes: 'bg-yellow-100 text-yellow-700' },
  closed: { label: 'Closed', classes: 'bg-gray-100 text-gray-600' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}

// Generic badge for roles, labels, counts etc.
interface BadgeProps {
  label: string;
  color?: 'gray' | 'indigo' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorClasses: Record<string, string> = {
  gray:   'bg-gray-100 text-gray-600',
  indigo: 'bg-indigo-100 text-indigo-700',
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {label}
    </span>
  );
}
