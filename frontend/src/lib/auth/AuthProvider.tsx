'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  type AccountInfo,
  type AuthenticationResult,
} from '@azure/msal-browser';
import { msalConfig, loginRequest, silentRequest } from './msalConfig';
import type { AuthUser } from '@/types';

// ── Singleton MSAL instance (created once, never recreated) ───
let msalInstance: PublicClientApplication | null = null;

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

// ── Context shape ──────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const msalRef = useRef<PublicClientApplication | null>(null);

  // ── Initialize MSAL on mount ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const msal = getMsalInstance();
        await msal.initialize();
        msalRef.current = msal;

        // Handle the redirect callback after Entra ID login
        const response: AuthenticationResult | null =
          await msal.handleRedirectPromise();

        if (response?.account) {
          msal.setActiveAccount(response.account);
          await syncBackendSession(response.accessToken, msal, response.account);
        } else {
          // Restore from existing MSAL session (sessionStorage cache)
          const accounts = msal.getAllAccounts();
          if (accounts.length > 0) {
            msal.setActiveAccount(accounts[0]);
            await restoreSession(msal, accounts[0]);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('[Auth] Init error:', err);
          setError('Authentication initialization failed. Please refresh.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Silently refresh token and restore backend session ───────
  const restoreSession = async (
    msal: PublicClientApplication,
    account: AccountInfo,
  ) => {
    try {
      const response = await msal.acquireTokenSilent({ ...silentRequest, account });
      await syncBackendSession(response.accessToken, msal, account);
    } catch {
      // Session stale — user needs to log in again
      setUser(null);
    }
  };

  // ── Tell backend about this token so it can establish session ─
  const syncBackendSession = async (
    _accessToken: string,
    msal: PublicClientApplication,
    account: AccountInfo,
  ) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Backend has no session cookie yet — build user from MSAL account
        const claims = account.idTokenClaims as Record<string, unknown>;
        setUser({
          oid: account.homeAccountId,
          name: account.name ?? '',
          email: account.username,
          tenantId: account.tenantId,
          roles: Array.isArray(claims?.roles) ? (claims.roles as string[]) : [],
        });
      }
    } catch {
      const claims = account.idTokenClaims as Record<string, unknown>;
      setUser({
        oid: account.homeAccountId,
        name: account.name ?? '',
        email: account.username,
        tenantId: account.tenantId,
        roles: Array.isArray(claims?.roles) ? (claims.roles as string[]) : [],
      });
    }
  };

  // ── Login ────────────────────────────────────────────────────
  const login = useCallback(async () => {
    const msal = getMsalInstance();
    setIsLoading(true);
    setError(null);
    try {
      // Redirect-based login — supports MFA and Conditional Access
      await msal.loginRedirect(loginRequest);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setError(msg);
      setIsLoading(false);
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const msal = getMsalInstance();
    try {
      // Revoke backend session first
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
    } finally {
      setUser(null);
      msal.logoutRedirect({ postLogoutRedirectUri: '/login' });
    }
  }, []);

  // ── Get a fresh access token (for API calls) ─────────────────
  const getAccessToken = useCallback(async (): Promise<string> => {
    const msal = getMsalInstance();
    const account = msal.getActiveAccount();
    if (!account) throw new Error('No active account. Please log in.');

    try {
      const response = await msal.acquireTokenSilent({ ...silentRequest, account });
      return response.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        // Consent or MFA step-up required → redirect
        await msal.acquireTokenRedirect({ ...loginRequest, account });
        throw new Error('Redirect initiated for interactive auth.');
      }
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        getAccessToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
