import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export const ComboBox = ({ options, value, onChange, placeholder = 'Select…' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = (options || []).filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between text-left"
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <input
            autoFocus
            className="w-full border-b border-slate-100 px-3 py-2 text-sm focus:outline-none"
            placeholder="Type to filter…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No options</p>}
            {filtered.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => {
                  onChange(opt === value ? '' : opt);
                  setOpen(false);
                  setSearch('');
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-brand-50"
              >
                {opt}
                {opt === value && <Check className="h-4 w-4 text-brand-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TagInput = ({ value = [], onChange, placeholder = 'Type and press Enter' }) => {
  const [input, setInput] = useState('');

  const safeValues = (Array.isArray(value) ? value : []).map((t) =>
    typeof t === 'string' ? t : (t?.name || t?.title || t?.degree || JSON.stringify(t))
  );

  const addTag = () => {
    const tag = input.trim();
    if (tag && !safeValues.includes(tag)) onChange([...safeValues, tag]);
    setInput('');
  };

  return (
    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
      <div className="flex flex-wrap gap-1.5">
        {safeValues.map((tag, idx) => (
          <span key={`${tag}-${idx}`} className="badge bg-brand-100 text-brand-700">
            {tag}
            <button type="button" className="ml-1 text-brand-400 hover:text-brand-700" onClick={() => onChange(safeValues.filter((_, i) => i !== idx))}>×</button>
          </span>
        ))}
        <input
          className="min-w-24 flex-1 text-sm focus:outline-none"
          value={input}
          placeholder={safeValues.length ? '' : placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
            if (e.key === 'Backspace' && !input && safeValues.length) {
              onChange(safeValues.slice(0, -1));
            }
          }}
        />
      </div>
    </div>
  );
};