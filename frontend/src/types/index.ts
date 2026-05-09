// ── Authenticated User ──────────────────────────────────────────
export interface AuthUser {
  oid: string;
  name: string;
  email: string;
  tenantId: string;
  roles: string[];
}

// ── API Responses ──────────────────────────────────────────────
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Dashboard Widgets ──────────────────────────────────────────
export interface DashboardSummary {
  users: {
    total: number;
    enabled: number;
    disabled: number;
  };
  devices: {
    total: number;
    compliant: number;
    nonCompliant: number;
    pending: number;
  };
  groups: {
    total: number;
  };
  licenses: {
    total: number;
    consumed: number;
    available: number;
    skus: LicenseSku[];
  };
  organization: {
    name: string;
    domains: string[];
  };
}

export interface LicenseSku {
  skuPartNumber: string;
  total: number;
  consumed: number;
  available: number;
}

export interface AuditEvent {
  id: string;
  activityDateTime: string;
  activityDisplayName: string;
  result: 'success' | 'failure' | 'timeout' | 'unknownFutureValue';
  initiatedBy: {
    user?: { displayName: string; userPrincipalName: string };
    app?: { displayName: string };
  };
  targetResources: Array<{
    displayName: string;
    type: string;
  }>;
}

// ── Navigation ──────────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

// ── Utility ────────────────────────────────────────────────────
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
