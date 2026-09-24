export const Badge = ({ children, className = 'bg-slate-100 text-slate-600' }) => (
  <span className={`badge ${className}`}>{children}</span>
);

export const StatusBadge = ({ status, map = {} }) => {
  const color = map[status] || 'bg-slate-100 text-slate-600';
  return <Badge className={color}>{status || '—'}</Badge>;
};

export const MatchBadge = ({ score }) => {
  if (score === null || score === undefined) return <Badge className="bg-slate-100 text-slate-500">Not scored</Badge>;
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <Badge className={color}>{score}%</Badge>;
};

export const MatchBar = ({ score }) => {
  const normalized = Math.max(0, Math.min(100, score || 0));
  const color = normalized >= 80 ? 'bg-emerald-500' : normalized >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${normalized}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{score || 0}%</span>
    </div>
  );
};