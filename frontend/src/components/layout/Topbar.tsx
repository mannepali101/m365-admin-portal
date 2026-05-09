'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/users': 'User Management',
  '/dashboard/groups': 'Entra ID Groups',
  '/dashboard/licenses': 'License Management',
  '/dashboard/devices': 'Intune Devices',
  '/dashboard/compliance': 'Compliance Policies',
  '/dashboard/reports': 'Reports & Analytics',
  '/dashboard/audit': 'Audit Logs',
  '/dashboard/automation': 'Automation Workflows',
  '/settings': 'Settings',
};

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'High-risk sign-in detected', body: 'Unusual login pattern flagged', time: '2m ago', type: 'error' as const },
  { id: 2, title: 'MFA enrollment pending', body: '168 accounts without MFA', time: '1h ago', type: 'warn' as const },
  { id: 3, title: 'Device sync complete', body: '1,432 devices synced successfully', time: '2h ago', type: 'info' as const },
];

export function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageTitle = PAGE_TITLES[pathname] ?? 'M365 Admin';

  // Close dropdowns on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const typeStyle = {
    error: 'bg-red-500',
    warn: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <header className="h-14 min-h-[56px] flex items-center gap-4 px-5 bg-[#0a1628] border-b border-[#1e3a5f]">

      {/* Page title */}
      <h1 className="text-sm font-semibold text-slate-200 mr-2">{pageTitle}</h1>

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="search"
          placeholder="Search users, devices, groups…"
          className="input pl-8 h-8 text-xs"
          aria-label="Global search"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="relative w-8 h-8 flex items-center justify-center rounded-md border border-[#1e3a5f] text-slate-400 hover:bg-[#112240] hover:text-slate-200 transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {/* Unread dot */}
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-72 bg-[#0a1628] border border-[#1e3a5f] rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-2.5 border-b border-[#1e3a5f] flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">Notifications</p>
                <button className="text-[10px] text-blue-400 hover:text-blue-300">Mark all read</button>
              </div>
              {MOCK_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#0a1e35] hover:bg-[#112240] cursor-pointer transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeStyle[n.type]}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{n.title}</p>
                    <p className="text-[11px] text-slate-500">{n.body}</p>
                  </div>
                  <p className="text-[10px] text-slate-600 flex-shrink-0 mt-0.5">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-[#1e3a5f] text-slate-400 hover:bg-[#112240] hover:text-slate-200 transition-colors"
          aria-label="Refresh page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#1e3a5f] mx-1" />

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#112240] transition-colors"
            aria-haspopup="true"
            aria-expanded={showUserMenu}
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate max-w-[120px]">{user?.name ?? '—'}</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email ?? '—'}</p>
            </div>
            <svg className="w-3 h-3 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 w-56 bg-[#0a1628] border border-[#1e3a5f] rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
              {/* User info */}
              <div className="px-4 py-3 border-b border-[#1e3a5f]">
                <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{user?.email}</p>
                <div className="mt-1.5">
                  <span className="badge-purple text-[10px]">
                    {user?.roles?.[0] ?? 'Admin'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <a href="/settings" className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-[#112240] transition-colors">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </a>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
