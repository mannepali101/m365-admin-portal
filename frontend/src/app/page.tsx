import { redirect } from 'next/navigation';

/**
 * Root page.
 * The middleware handles session-based redirects for protected paths.
 * Here we simply redirect to /dashboard; middleware will intercept
 * and send unauthenticated users to /login.
 */
export default function RootPage() {
  redirect('/dashboard');
}
