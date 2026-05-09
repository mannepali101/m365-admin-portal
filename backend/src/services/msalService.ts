import { ConfidentialClientApplication } from '@azure/msal-node';
import { MSAL_CONFIG, GRAPH_SCOPES, env } from '../config/env.js';
import { tokenStore, type StoredTokens } from '../utils/tokenStore.js';
import { AppError } from '../utils/AppError.js';

// Singleton MSAL confidential client
export const msalClient = new ConfidentialClientApplication({ auth: MSAL_CONFIG.auth });

// -------------------------------------------------------------------
// Generate an Entra ID OAuth2 authorization URL
// -------------------------------------------------------------------
export async function buildAuthUrl(state: string): Promise<string> {
  return msalClient.getAuthCodeUrl({
    scopes: [...GRAPH_SCOPES],
    redirectUri: env.AZURE_REDIRECT_URI,
    state,
    prompt: 'select_account',
    responseMode: 'query',
  });
}

// -------------------------------------------------------------------
// Exchange authorization code → tokens, cache them server-side
// -------------------------------------------------------------------
export async function exchangeCode(
  code: string,
  sessionId: string,
): Promise<StoredTokens> {
  const response = await msalClient.acquireTokenByCode({
    code,
    scopes: [...GRAPH_SCOPES],
    redirectUri: env.AZURE_REDIRECT_URI,
  });

  if (!response || !response.accessToken) {
    throw new AppError('Token exchange failed — empty response from MSAL', 401);
  }

  const tokens: StoredTokens = {
    accessToken: response.accessToken,
    idToken: response.idToken ?? '',
    expiresOn: response.expiresOn?.toISOString() ?? new Date(Date.now() + 3600_000).toISOString(),
    account: (response.account ?? {}) as Record<string, unknown>,
    scopes: response.scopes,
    tenantId: response.tenantId,
  };

  tokenStore.set(sessionId, tokens);
  return tokens;
}

// -------------------------------------------------------------------
// Get a valid access token, silently refreshing if <5 min to expiry
// -------------------------------------------------------------------
export async function getValidToken(sessionId: string): Promise<string> {
  const stored = tokenStore.get(sessionId);
  if (!stored) throw new AppError('Session not found or expired. Please log in again.', 401);

  const expiresAt = new Date(stored.expiresOn).getTime();
  const margin = 5 * 60 * 1000; // 5-minute buffer

  if (Date.now() + margin < expiresAt) {
    return stored.accessToken;
  }

  // Silent refresh via MSAL cache
  if (!stored.account?.homeAccountId) {
    throw new AppError('Cannot refresh: account info missing. Please log in again.', 401);
  }

  const accounts = await msalClient.getTokenCache().getAllAccounts();
  const account = accounts.find(a => a.homeAccountId === stored.account.homeAccountId);

  if (!account) {
    tokenStore.delete(sessionId);
    throw new AppError('Account not found in MSAL cache. Please log in again.', 401);
  }

  const refreshed = await msalClient
    .acquireTokenSilent({ scopes: [...GRAPH_SCOPES], account })
    .catch(() => null);

  if (!refreshed) {
    tokenStore.delete(sessionId);
    throw new AppError('Token refresh failed. Please log in again.', 401);
  }

  const updated: StoredTokens = {
    ...stored,
    accessToken: refreshed.accessToken,
    expiresOn: refreshed.expiresOn?.toISOString() ?? stored.expiresOn,
  };

  tokenStore.set(sessionId, updated);
  return updated.accessToken;
}

// -------------------------------------------------------------------
// Revoke server-side session (logout)
// -------------------------------------------------------------------
export function revokeTokens(sessionId: string): void {
  tokenStore.delete(sessionId);
}
