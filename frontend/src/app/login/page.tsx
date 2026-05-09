'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') ?? '/dashboard';

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060e1a]">
        <LoadingSpinner size="lg" label="Initializing authentication..." />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#060e1a] px-4">
      {/* Background grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#1e3a5f 1px, transparent 1px), linear-gradient(90deg, #1e3a5f 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-xl p-8 shadow-2xl">

          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-3xl shadow-lg">
              ⚡
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-slate-100 mb-1">
              M365 Admin Portal
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sign in with your Microsoft organizational account to access the
              administration dashboard.
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400 flex items-start gap-2">
                <span className="mt-px text-red-500">⚠</span>
                <span>{error}</span>
              </p>
              <button
                onClick={clearError}
                className="text-xs text-red-500 hover:text-red-400 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Sign-in button */}
          <button
            onClick={login}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#0d1f38] border border-[#1e3a5f]
                       hover:bg-[#112240] hover:border-blue-600
                       text-slate-200 text-sm font-medium
                       py-3 px-4 rounded-lg
                       transition-all duration-150
                       disabled:opacity-60 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
                       focus:ring-offset-[#0a1628]"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Redirecting to Microsoft…</span>
              </>
            ) : (
              <>
                <MicrosoftLogo />
                <span>Sign in with Microsoft Entra ID</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="my-6 border-t border-[#1e3a5f]" />

          {/* Security notice */}
          <div className="space-y-2">
            {[
              { icon: '🔒', text: 'Secured by OAuth 2.0 · PKCE flow' },
              { icon: '📱', text: 'Multi-factor authentication enforced' },
              { icon: '🚫', text: 'No passwords stored by this portal' },
            ].map(({ icon, text }) => (
              <p key={text} className="text-xs text-slate-500 flex items-center gap-2">
                <span>{icon}</span>
                <span>{text}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-4">
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'M365 Admin Portal'} · IT Administration
        </p>
      </div>
    </main>
  );
}
