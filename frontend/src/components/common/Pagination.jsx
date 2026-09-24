export const Pagination = ({ page, pages, total, onPageChange }) => {
  if (!pages || pages <= 1) return null;
  const pagesList = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) pagesList.push(i);

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm">
      <span className="text-slate-500">
        Page <b>{page}</b> of <b>{pages}</b> · {total} total
      </span>
      <div className="flex items-center gap-1">
        <button className="btn-secondary px-2.5 py-1.5" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
        {pagesList.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p}
          </button>
        ))}
        <button className="btn-secondary px-2.5 py-1.5" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
};