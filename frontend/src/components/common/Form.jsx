import { Search } from 'lucide-react';

export const SearchBar = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input pl-9"
    />
  </div>
);

export const FilterSelect = ({ label, value, onChange, options, allLabel = 'All' }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const text = typeof opt === 'string' ? opt : opt.label;
        return <option key={val} value={val}>{text}</option>;
      })}
    </select>
  </div>
);

export const FilterInput = ({ label, value, onChange, placeholder = '', type = 'text' }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <input type={type} className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </div>
);