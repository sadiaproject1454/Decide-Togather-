// Reusable Button component
// Usage: <Button variant="primary" onClick={...}>Click me</Button>

'use client';

import React from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;           // If provided, renders as a <Link>
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  outline:   'border border-gray-300 text-gray-700 hover:bg-gray-50',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost:     'text-gray-600 hover:bg-gray-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-lg font-medium
    transition-colors duration-150 cursor-pointer focus:outline-none
    focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const allClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  if (href) {
    return (
      <Link href={href} className={allClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={allClasses}
    >
      {children}
    </button>
  );
}
