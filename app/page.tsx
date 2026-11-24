// PAGE 1: Landing Page  →  Route: /
// This is the public homepage visitors see before they sign up.

import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Button from '@/app/components/Button';

const FEATURES = [
  {
    icon: '🗳️',
    title: 'Structured Voting',
    description: 'Create decisions with clear options. Everyone on the team can cast their vote in one place.',
  },
  {
    icon: '🏢',
    title: 'Workspaces',
    description: 'Organize decisions by team or project. Keep Product, Engineering, and Marketing separate.',
  },
  {
    icon: '📊',
    title: 'Real-time Results',
    description: 'Watch votes come in live. See which option is leading as your team weighs in.',
  },
  {
    icon: '⏰',
    title: 'Deadlines & Reminders',
    description: 'Set a deadline for each decision so nothing drags on forever.',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    description: 'Your team\'s decisions stay within your workspace. No public exposure.',
  },
  {
    icon: '💬',
    title: 'Discussion Threads',
    description: 'Comment on decisions before voting so everyone can share context.',
  },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Create a workspace', description: 'Set up a space for your team or project.' },
  { step: '2', title: 'Post a decision', description: 'Write the question and list the options.' },
  { step: '3', title: 'Invite your team', description: 'Share the workspace with the people who should vote.' },
  { step: '4', title: 'Vote & decide', description: 'Everyone votes and the results are clear.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span>✨</span> Built for modern teams
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Make decisions together,{' '}
            <span className="text-indigo-600">faster</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Decide Together helps your team vote on important choices, track outcomes, and move forward — without endless Slack threads or email chains.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/signup" size="lg">
              Start for free →
            </Button>
            <Button href="/dashboard" variant="outline" size="lg">
              View demo dashboard
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-400">No credit card required · Free for teams up to 5 people</p>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything your team needs</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              A simple, focused tool for collaborative decision-making.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-500">Four simple steps to better team decisions.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to decide together?</h2>
          <p className="text-indigo-200 text-lg mb-8">Join thousands of teams making better decisions every day.</p>
          <Button href="/signup" variant="secondary" size="lg">
            Create your free account →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            Decide Together
          </div>
          <p className="text-sm text-gray-400">© 2026 Decide Together. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-gray-600">Privacy</Link>
            <Link href="#" className="hover:text-gray-600">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
