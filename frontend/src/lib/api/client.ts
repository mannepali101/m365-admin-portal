import type { DashboardSummary, AuditEvent } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// ── Custom error class ─────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Core fetch wrapper ─────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({
    success: false,
    error: 'Failed to parse server response',
    statusCode: res.status,
  }));

  if (!res.ok) {
    throw new ApiError(
      body.error ?? 'Request failed',
      res.status,
      body.code,
    );
  }

  return body as T;
}

// ── Auth endpoints ─────────────────────────────────────────────
export const authApi = {
  /** Get the Entra ID authorization URL */
  getLoginUrl: () =>
    request<{ success: true; authUrl: string }>('/api/auth/login'),

  /** Exchange OAuth code for session */
  callback: (code: string, state: string) =>
    request<{ success: true; user: { name: string; email: string } }>(
      '/api/auth/callback',
      { method: 'POST', body: JSON.stringify({ code, state }) },
    ),

  /** Get current user profile from backend */
  me: () =>
    request<{
      success: true;
      user: { oid: string; name: string; email: string; tenantId: string; roles: string[] };
    }>('/api/auth/me'),

  /** Logout and destroy backend session */
  logout: () =>
    request<{ success: true }>('/api/auth/logout', { method: 'POST' }),

  /** Proactively refresh the session */
  refresh: () =>
    request<{ success: true }>('/api/auth/refresh', { method: 'POST' }),
};

// ── Dashboard endpoints ────────────────────────────────────────
export const dashboardApi = {
  /** Aggregated widget data: users, devices, licenses, org */
  getSummary: () =>
    request<{ success: true; data: DashboardSummary; timestamp: string }>(
      '/api/dashboard/summary',
    ),

  /** Recent directory audit events */
  getRecentActivity: () =>
    request<{ success: true; data: AuditEvent[] }>(
      '/api/dashboard/recent-activity',
    ),
};

// ── Health check ───────────────────────────────────────────────
export const healthApi = {
  check: () =>
    request<{ status: string; timestamp: string }>('/health'),
};
