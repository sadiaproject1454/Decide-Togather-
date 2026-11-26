'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { getInitials, type UserProfile, type WorkspaceSummary } from '@/app/lib/types';

interface SidebarProps {
  user: UserProfile;
  workspaces: WorkspaceSummary[];
}

export default function Sidebar({ user, workspaces }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user.full_name?.trim() || user.email.split('@')[0] || 'User';
  const initials = getInitials(displayName);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'Workspaces', href: '/workspaces', icon: '🗂️', matchPrefix: '/workspaces' },
    { label: 'Decisions', href: '/decisions', icon: '🗳️' },
    { label: 'Profile', href: '/profile', icon: '👤' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <span className="font-bold text-gray-900">Decide Together</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Close menu"
        >
          ×
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const checkPrefix = item.matchPrefix ?? item.href;
          const isActive =
            pathname === item.href ||
            (checkPrefix !== '/dashboard' && pathname.startsWith(checkPrefix));
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Workspaces list */}
        <div className="pt-4">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Workspaces
          </p>
          {workspaces.length === 0 ? (
            <p className="px-3 text-xs text-gray-400">No workspaces yet</p>
          ) : (
            workspaces.map((ws) => {
              const wsPath = `/workspaces/${ws.id}`;
              const isActive = pathname === wsPath;
              return (
                <Link
                  key={ws.id}
                  href={wsPath}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {ws.name[0]?.toUpperCase() ?? 'W'}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </Link>
              );
            })
          )}
        </div>
      </nav>

      {/* User area + Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 p-1.5 -m-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </Link>

        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors cursor-pointer py-1"
          >
            <span>🚪</span> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="text-sm">Decide Together</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700"
        >
          Menu
        </button>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-white h-full border-r border-gray-200 shadow-xl">
            {sidebarContent}
          </div>
          <div
            className="flex-1 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
