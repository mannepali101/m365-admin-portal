import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    template: '%s | M365 Admin Portal',
    default: 'M365 Admin Portal',
  },
  description: 'Centralized Microsoft 365 administration portal',
  robots: { index: false, follow: false }, // Admin tools should not be indexed
};

export const viewport: Viewport = {
  themeColor: '#060e1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#060e1a] text-slate-200 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
