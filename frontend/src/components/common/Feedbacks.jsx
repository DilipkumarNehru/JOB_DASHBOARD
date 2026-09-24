export const Spinner = ({ className = 'h-6 w-6' }) => (
  <div className={`animate-spin rounded-full border-2 border-brand-600 border-t-transparent ${className}`} />
);

export const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Spinner className="h-8 w-8" />
  </div>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
);

export const SkeletonTable = ({ rows = 6 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
    ))}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
    <p className="text-sm font-medium text-red-700">{message || 'Something went wrong'}</p>
    {onRetry && (
      <button className="btn-secondary mt-4" onClick={onRetry}>Try again</button>
    )}
  </div>
);

export const EmptyState = ({ icon = '📭', title = 'Nothing here yet', description = 'Data will appear here when available.', action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center">
    <span className="text-4xl">{icon}</span>
    <h3 className="mt-3 text-base font-semibold text-slate-800">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);