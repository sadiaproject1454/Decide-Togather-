// Navbar — top navigation for public pages (landing, login, signup)
// This is a Server Component (no interactivity needed)

import Link from 'next/link';
import Button from './Button';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span>Decide Together</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</Link>
            <Link href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Button href="/login" variant="ghost" size="sm">Log in</Button>
            <Button href="/signup" variant="primary" size="sm">Get started</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
