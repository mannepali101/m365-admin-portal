import { cn } from '@/lib/utils/cn';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg bg-red-950/50 border border-red-800/50',
        className,
      )}
    >
      <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 text-xs text-red-400 underline hover:text-red-300 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
