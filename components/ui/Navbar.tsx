'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const links = [
    { href: '/dashboard', label: 'Dashboards' },
    { href: '/upload', label: 'Upload' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto px-6 h-12 flex items-center justify-between gap-6">
        <Link href="/" className="text-sm font-semibold text-zinc-50 tracking-tight hover:text-emerald-400 transition-colors">
          DashWise
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  active
                    ? 'text-zinc-50 bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {status === 'loading' ? (
            <div className="w-20 h-7 rounded-md bg-zinc-800 animate-pulse" />
          ) : session ? (
            <>
              {session.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? 'avatar'}
                  className="w-7 h-7 rounded-full border border-zinc-700"
                />
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: '/dashboard' })}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-md transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
