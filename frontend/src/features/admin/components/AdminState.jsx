export function LoadingState({ label = "Loading..." }) {
  return <div className="admin-state"><span className="spinner" aria-hidden="true" /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="admin-state admin-state-error" role="alert">
      <span>{message || "Could not load this data."}</span>
      {onRetry && <button className="button button-secondary button-small" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", description }) {
  return <div className="empty-state"><strong>{title}</strong>{description && <span>{description}</span>}</div>;
}
