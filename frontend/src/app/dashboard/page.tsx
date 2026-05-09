'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useApi } from '@/lib/hooks/useApi';
import { dashboardApi } from '@/lib/api/client';
import { StatsCard } from '@/components/widgets/StatsCard';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import type { DashboardSummary, AuditEvent } from '@/types';

// ── Icons ─────────────────────────────────────────────────────
function UserIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}

// ── License usage bar ─────────────────────────────────────────
function LicenseBar({ name, consumed, total, color }: { name: string; consumed: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((consumed / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-slate-400 truncate pr-2">{name}</span>
        <span className="text-xs font-mono text-slate-300 flex-shrink-0">{consumed}/{total}</span>
      </div>
      <div className="h-1 bg-[#1e3a5f] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Activity item ─────────────────────────────────────────────
function ActivityItem({ event }: { event: AuditEvent }) {
  const actor =
    event.initiatedBy?.user?.userPrincipalName ??
    event.initiatedBy?.app?.displayName ??
    'System';

  const target = event.targetResources?.[0]?.displayName ?? '—';

  const resultStyle =
    event.result === 'success'
      ? 'badge-green'
      : event.result === 'failure'
      ? 'badge-red'
      : 'badge-gray';

  const date = new Date(event.activityDateTime);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#0a1e35] last:border-b-0 text-xs">
      <span className="text-[10px] font-mono text-slate-500 min-w-[42px] pt-0.5">{time}</span>
      <div className="flex-1 min-w-0">
        <span className="text-slate-400">{actor}</span>
        <span className="text-slate-600 mx-1">→</span>
        <span className="text-slate-300 font-medium">{event.activityDisplayName}</span>
        {target !== '—' && (
          <span className="text-slate-500 ml-1 truncate block">on {target}</span>
        )}
      </div>
      <span className={resultStyle}>{event.result}</span>
    </div>
  );
}

// ── Placeholder Activity (when not connected to Graph) ────────
const PLACEHOLDER_ACTIVITY = [
  { time: 'Now', actor: 'alex@contoso.com', action: 'Password reset', target: 'carol@contoso.com', result: 'success' },
  { time: '09:38', actor: 'system', action: 'CA Policy triggered', target: 'frank@contoso.com', result: 'failure' },
  { time: '09:22', actor: 'frank@contoso.com', action: 'Device enrolled', target: 'LAPTOP-FRK001', result: 'success' },
  { time: '08:55', actor: 'alex@contoso.com', action: 'License assigned', target: 'david@contoso.com', result: 'success' },
  { time: '08:30', actor: 'system', action: 'MFA failed ×3', target: '203.0.113.42', result: 'failure' },
];

// ── Main page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  const summaryApi = useApi(dashboardApi.getSummary);
  const activityApi = useApi(dashboardApi.getRecentActivity);

  useEffect(() => {
    summaryApi.execute();
    activityApi.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = summaryApi.data?.data as DashboardSummary | undefined;
  const activity = activityApi.data?.data as AuditEvent[] | undefined;

  const licenseColors = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-5 max-w-[1200px]">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            {user?.name?.split(' ')[0] ?? 'Admin'} 👋
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {summary?.organization.name ?? 'Your organization'} · Microsoft 365 Tenant
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { summaryApi.execute(); activityApi.execute(); }}
            disabled={summaryApi.isLoading}
            className="btn-ghost text-xs disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${summaryApi.isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
          <a href="/dashboard/users" className="btn-primary text-xs">
            + New User
          </a>
        </div>
      </div>

      {/* Error banners */}
      {summaryApi.isError && (
        <ErrorBanner
          message={`Could not load summary: ${summaryApi.error}. Showing placeholder data.`}
          onRetry={summaryApi.execute}
        />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          label="Total Users"
          value={summary?.users.total ?? 2847}
          delta={`${summary?.users.disabled ?? 12} disabled`}
          deltaType="neutral"
          icon={<UserIcon />}
          isLoading={summaryApi.isLoading}
        />
        <StatsCard
          label="Managed Devices"
          value={summary?.devices.total ?? 1432}
          delta={`${summary?.devices.nonCompliant ?? 23} non-compliant`}
          deltaType={(summary?.devices.nonCompliant ?? 23) > 0 ? 'warn' : 'up'}
          icon={<DeviceIcon />}
          isLoading={summaryApi.isLoading}
        />
        <StatsCard
          label="Active Licenses"
          value={summary?.licenses.consumed ?? 2847}
          delta={`${summary?.licenses.available ?? 303} available`}
          deltaType="up"
          isLoading={summaryApi.isLoading}
        />
        <StatsCard
          label="Groups"
          value={summary?.groups.total ?? 48}
          delta="Security & M365 groups"
          deltaType="neutral"
          isLoading={summaryApi.isLoading}
        />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* License usage */}
        <div className="card">
          <div className="px-4 py-3 border-b border-[#1e3a5f] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">License Usage by SKU</h3>
            <a href="/dashboard/licenses" className="text-[11px] text-blue-400 hover:text-blue-300">View all →</a>
          </div>
          <div className="p-4 space-y-3">
            {summaryApi.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-1 rounded-full" />
                  </div>
                ))
              : (summary?.licenses.skus?.length
                  ? summary.licenses.skus.slice(0, 5).map((sku, i) => (
                      <LicenseBar
                        key={sku.skuPartNumber}
                        name={sku.skuPartNumber.replace(/_/g, ' ')}
                        consumed={sku.consumed}
                        total={sku.total}
                        color={licenseColors[i % licenseColors.length]}
                      />
                    ))
                  : [
                      { name: 'Microsoft 365 E5', consumed: 312, total: 350, color: '#a855f7' },
                      { name: 'Microsoft 365 E3', consumed: 1820, total: 2000, color: '#3b82f6' },
                      { name: 'Microsoft 365 E1', consumed: 650, total: 800, color: '#22c55e' },
                    ].map((l, i) => (
                      <LicenseBar key={i} name={l.name} consumed={l.consumed} total={l.total} color={l.color} />
                    ))
                )}
          </div>
        </div>

        {/* Device compliance */}
        <div className="card">
          <div className="px-4 py-3 border-b border-[#1e3a5f] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">Device Compliance</h3>
            <a href="/dashboard/devices" className="text-[11px] text-blue-400 hover:text-blue-300">Manage →</a>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Compliant', value: summary?.devices.compliant ?? 1270, color: '#22c55e', pct: 89 },
              { label: 'Non-compliant', value: summary?.devices.nonCompliant ?? 104, color: '#ef4444', pct: 7 },
              { label: 'Pending', value: summary?.devices.pending ?? 58, color: '#f59e0b', pct: 4 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-300">
                      {summaryApi.isLoading ? '…' : item.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
                  {!summaryApi.isLoading && (
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.pct}%`, background: item.color }}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Compliance score */}
            <div className="mt-2 p-3 bg-[#060e1a] rounded-lg border border-[#1e3a5f] flex items-center justify-between">
              <span className="text-xs text-slate-400">Overall compliance</span>
              <span className="text-sm font-bold font-mono text-green-400">89%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security alerts + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Security alerts */}
        <div className="card">
          <div className="px-4 py-3 border-b border-[#1e3a5f] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">Security Alerts</h3>
            <span className="badge-amber">3 active</span>
          </div>
          <div className="p-4 space-y-2">
            {[
              { title: 'High-risk sign-in detected', desc: 'frank@contoso.com — unknown location', level: 'error' as const },
              { title: 'MFA not enrolled — 168 accounts', desc: 'Enforcement deadline in 72h', level: 'warn' as const },
              { title: 'Non-compliant device access attempt', desc: 'MACBOOK-CAROL blocked by CA policy', level: 'warn' as const },
            ].map((alert) => (
              <div key={alert.title} className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                alert.level === 'error'
                  ? 'bg-red-950/30 border-red-900/50'
                  : 'bg-amber-950/30 border-amber-900/50'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${alert.level === 'error' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${alert.level === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                    {alert.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{alert.desc}</p>
                </div>
              </div>
            ))}
            <a href="/dashboard/audit" className="btn-ghost text-xs w-full justify-center mt-1 block text-center py-1.5">
              View all in Audit Logs →
            </a>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="px-4 py-3 border-b border-[#1e3a5f] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">Recent Activity</h3>
            {activityApi.isLoading && (
              <div className="w-3 h-3 border border-[#1e3a5f] border-t-blue-500 rounded-full animate-spin" />
            )}
          </div>
          <div className="px-4 py-1">
            {activityApi.isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-2.5 border-b border-[#0a1e35] last:border-b-0 flex gap-3">
                    <div className="skeleton h-3 w-10 rounded" />
                    <div className="skeleton h-3 flex-1 rounded" />
                  </div>
                ))
              : activity && activity.length > 0
              ? activity.slice(0, 7).map((event) => (
                  <ActivityItem key={event.id} event={event} />
                ))
              : PLACEHOLDER_ACTIVITY.map((item) => (
                  <div key={item.action + item.time} className="flex items-start gap-3 py-2.5 border-b border-[#0a1e35] last:border-b-0 text-xs">
                    <span className="text-[10px] font-mono text-slate-500 min-w-[42px] pt-0.5">{item.time}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-blue-400">{item.actor}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className="text-slate-300">{item.action}</span>
                      <span className="text-slate-500 ml-1">on {item.target}</span>
                    </div>
                    <span className={item.result === 'success' ? 'badge-green' : 'badge-red'}>
                      {item.result}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="px-4 py-3 border-b border-[#1e3a5f]">
          <h3 className="text-xs font-semibold text-slate-300">Quick Actions</h3>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Create User', href: '/dashboard/users', emoji: '👤' },
            { label: 'Reset Password', href: '/dashboard/users', emoji: '🔑' },
            { label: 'Sync Devices', href: '/dashboard/devices', emoji: '📱' },
            { label: 'View Reports', href: '/dashboard/reports', emoji: '📊' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#060e1a] border border-[#1e3a5f] hover:border-blue-600 hover:bg-[#0a1f3f] transition-all text-center"
            >
              <span className="text-xl">{action.emoji}</span>
              <span className="text-xs text-slate-300 font-medium">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
