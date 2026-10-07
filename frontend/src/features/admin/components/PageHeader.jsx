export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="admin-page-header">
      <div>
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="admin-description">{description}</p>}
      </div>
      {action && <div className="admin-header-action">{action}</div>}
    </div>
  );
}
