export const Card = ({ children, className = '', title, subtitle, actions }) => (
  <div className={`card ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

export const StatCard = ({ label, value, sublabel, icon: Icon, color = 'bg-brand-50 text-brand-600' }) => (
  <div className="card flex items-start gap-4 p-5">
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
      {Icon && <Icon className="h-5 w-5" />}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="mt-0.5 truncate text-xs text-slate-500">{sublabel}</p>}
    </div>
  </div>
);