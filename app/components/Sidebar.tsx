'use client';
// Sidebar — the left navigation panel for authenticated dashboard pages
// Must be a Client Component because it uses usePathname() to highlight active links

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SAMPLE_WORKSPACES } from '@/app/lib/data';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard',           icon: '🏠' },
  { label: 'Decisions',   href: '/decisions',           icon: '🗳️' },
  { label: 'Workspaces',  href: '/workspaces/ws-1',     icon: '🗂️' },
  { label: 'Settings',    href: '/settings',            icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">D</span>
        </div>
        <span className="font-bold text-gray-900">Decide Together</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
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

        {/* Workspaces section */}
        <div className="pt-4">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Workspaces
          </p>
          {SAMPLE_WORKSPACES.map((ws) => {
            const wsPath = `/workspaces/${ws.id}`;
            const isActive = pathname === wsPath;
            return (
              <Link
                key={ws.id}
                href={wsPath}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {ws.name[0]}
                </div>
                <span className="truncate">{ws.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User area at bottom */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
            AJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Alice Johnson</p>
            <p className="text-xs text-gray-400 truncate">alice@example.com</p>
          </div>
        </div>
        <Link
          href="/login"
          className="mt-3 flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <span>🚪</span> Sign out
        </Link>
      </div>
    </aside>
  );
}
