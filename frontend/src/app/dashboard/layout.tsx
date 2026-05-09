'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Full-screen spinner while MSAL initializes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060e1a]">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-400">Loading portal…</p>
        </div>
      </div>
    );
  }

  // Don't flash the dashboard before redirect
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#060e1a]">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />

        {/* Scrollable page content */}
        <main
          id="dashboard-main"
          className="flex-1 overflow-y-auto p-5"
        >
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
