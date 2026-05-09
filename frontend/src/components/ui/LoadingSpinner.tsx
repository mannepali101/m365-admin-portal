import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)} role="status" aria-label={label ?? 'Loading'}>
      <div
        className={cn(
          'rounded-full border-[#1e3a5f] border-t-blue-500 animate-spin',
          SIZE_CLASSES[size],
        )}
      />
      {label && <p className="text-xs text-slate-400">{label}</p>}
    </div>
  );
}
