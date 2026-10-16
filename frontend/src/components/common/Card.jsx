import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

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

export const StatCard = ({
  label,
  value,
  sublabel,
  sub,
  icon: Icon,
  color = 'bg-brand-50 text-brand-600',
  to,
  onClick,
  active = false,
  className = ''
}) => {
  const displaySub = sublabel || sub;
  const isClickable = !!to || !!onClick;

  const content = (
    <div className="flex items-start gap-3.5 w-full">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color} transition-transform duration-200 ${isClickable ? 'group-hover:scale-105' : ''}`}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">{label}</p>
          {isClickable && (
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all duration-200 shrink-0 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}
        </div>
        <p className={`mt-1 text-2xl font-black text-slate-900 tracking-tight transition-colors ${isClickable ? 'group-hover:text-blue-600' : ''}`}>
          {value}
        </p>
        {displaySub && (
          <p className="mt-0.5 truncate text-[11px] text-slate-500 font-medium" title={displaySub}>
            {displaySub}
          </p>
        )}
      </div>
    </div>
  );

  const baseClasses = `card relative p-4 transition-all duration-200 select-none ${className} ${
    isClickable
      ? 'group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 active:translate-y-0'
      : ''
  } ${active ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20' : ''}`;

  if (to) {
    return (
      <Link to={to} className={`block ${baseClasses}`}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } }}
        className={baseClasses}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
};