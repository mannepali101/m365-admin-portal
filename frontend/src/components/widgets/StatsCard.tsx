import { cn } from '@/lib/utils/cn';

interface StatsCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'up' | 'down' | 'warn' | 'neutral';
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

const DELTA_STYLES = {
  up: 'text-green-400',
  down: 'text-red-400',
  warn: 'text-amber-400',
  neutral: 'text-slate-400',
};

export function StatsCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  icon,
  isLoading,
  className,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className={cn('card p-4 space-y-3', className)}>
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-8 w-16 rounded" />
        <div className="skeleton h-2.5 w-28 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('card p-4 flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-slate-500 flex-shrink-0">
            {icon}
          </span>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>

      <p className="text-2xl font-bold text-slate-100 font-mono leading-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {delta && (
        <p className={cn('text-[11px] flex items-center gap-1', DELTA_STYLES[deltaType])}>
          {deltaType === 'up' && '↑'}
          {deltaType === 'down' && '↓'}
          {deltaType === 'warn' && '⚠'}
          {delta}
        </p>
      )}
    </div>
  );
}
