export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages < 2) return null;
  return (
    <div className="pagination">
      <span>Page {page} of {totalPages}</span>
      <div>
        <button className="button button-secondary button-small" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
        <button className="button button-secondary button-small" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}
