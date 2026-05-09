'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * /auth/callback
 *
 * This page handles the OAuth redirect from Microsoft Entra ID.
 * MSAL processes the URL hash/query params automatically via
 * handleRedirectPromise() in the AuthProvider.
 *
 * This page also extracts `code` and `state` from the URL and
 * calls the backend to exchange the code for a server-side session.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle Entra ID errors (user cancelled, MFA failed, etc.)
      if (error) {
        console.error('[Auth Callback] Error from Entra ID:', error, errorDescription);
        router.replace(`/login?error=${encodeURIComponent(errorDescription ?? error)}`);
        return;
      }

      if (!code || !state) {
        router.replace('/login');
        return;
      }

      try {
        // Tell the backend to exchange the code for tokens
        await authApi.callback(code, state);

        // Set a lightweight indicator cookie so middleware knows the session exists
        document.cookie = 'm365admin.session=1; path=/; SameSite=Lax; max-age=28800';

        router.replace('/dashboard');
      } catch (err) {
        console.error('[Auth Callback] Backend exchange failed:', err);
        router.replace('/login?error=Authentication+failed.+Please+try+again.');
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060e1a] gap-4">
      <LoadingSpinner size="lg" />
      <div className="text-center">
        <p className="text-sm font-medium text-slate-200">Completing sign-in…</p>
        <p className="text-xs text-slate-500 mt-1">Establishing secure session</p>
      </div>
    </div>
  );
}
