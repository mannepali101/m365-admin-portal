'use client';

import { useAuth } from '@/lib/auth/AuthProvider';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Portal configuration and account preferences
        </p>
      </div>

      {/* Account card */}
      <div className="card">
        <div className="px-4 py-3 border-b border-[#1e3a5f]">
          <h3 className="text-xs font-semibold text-slate-300">Account</h3>
        </div>
        <div className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
            {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-slate-100">{user?.name ?? '—'}</p>
            <p className="text-xs text-slate-400">{user?.email ?? '—'}</p>
            <p className="text-xs text-slate-500 font-mono">Tenant: {user?.tenantId ?? '—'}</p>
            {(user?.roles?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {user!.roles.map((role) => (
                  <span key={role} className="badge-purple">{role}</span>
                ))}
              </div>
            )}
          </div>
          <button onClick={logout} className="btn-danger text-xs flex-shrink-0">
            Sign out
          </button>
        </div>
      </div>

      {/* Environment info */}
      <div className="card">
        <div className="px-4 py-3 border-b border-[#1e3a5f]">
          <h3 className="text-xs font-semibold text-slate-300">Connection Info</h3>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: 'Backend API', value: process.env.NEXT_PUBLIC_API_URL ?? '—' },
            { label: 'Tenant ID', value: process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? '—' },
            { label: 'Client ID', value: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? '—' },
            { label: 'Redirect URI', value: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ?? '—' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#0a1e35] last:border-b-0">
              <span className="text-xs text-slate-500">{item.label}</span>
              <span className="text-xs font-mono text-slate-300 truncate max-w-[260px]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phase notice */}
      <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-lg">
        <p className="text-xs text-blue-300">
          <strong>Phase 1 complete.</strong> This portal is authenticated via Microsoft Entra ID.
          Phases 2+ will add full CRUD for users, devices, groups, reports, audit logs, and automation workflows.
        </p>
      </div>
    </div>
  );
}
