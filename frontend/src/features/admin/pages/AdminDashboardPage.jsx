import { Link } from "react-router-dom";
import { adminApi } from "../api/admin.api.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/AdminState.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useAdminData } from "../hooks/useAdminData.js";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function MetricCard({ label, value, note, icon }) {
  return (
    <article className="metric-card">
      <div className="metric-topline"><span>{label}</span><span className="metric-icon">{icon}</span></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function AdminDashboardPage() {
  const { data, loading, error, reload } = useAdminData(async () => {
    const [report, businesses, users, subscriptions, plans, categories] = await Promise.all([
      adminApi.report({}),
      adminApi.businesses({ page: 1, limit: 5 }),
      adminApi.users({ page: 1, limit: 5 }),
      adminApi.subscriptions({ page: 1, limit: 5 }),
      adminApi.plans(),
      adminApi.categories(),
    ]);
    return { report: report.data, businesses, users, subscriptions, plans: plans.data, categories: categories.data };
  }, []);

  if (loading) return <LoadingState label="Loading overview..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const totals = data.report?.totals || {};
  const daily = data.report?.daily || [];
  const chartMax = Math.max(...daily.map((item) => item.bookings), 1);

  return (
    <>
      <PageHeader eyebrow="Workspace" title="Overview" description="Platform activity at a glance." />
      <section className="metric-grid">
        <MetricCard label="Businesses" value={formatNumber(totals.businesses)} note="Registered on the platform" icon="⌂" />
        <MetricCard label="Bookings" value={formatNumber(totals.bookings)} note="In the selected date range" icon="▣" />
        <MetricCard label="Revenue" value={formatNumber(totals.revenue)} note="Confirmed and completed" icon="↗" />
        <MetricCard label="Users" value={formatNumber(Object.values(data.report?.usersByRole || {}).reduce((sum, count) => sum + count, 0))} note="Across all account roles" icon="♙" />
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-card dashboard-chart-card">
          <div className="card-heading"><div><h2>Bookings</h2><p>Recent activity by day</p></div><Link to="/admin/reports">View reports <span aria-hidden="true">→</span></Link></div>
          {daily.length ? (
            <div className="dashboard-bars" aria-label="Bookings by day">
              {daily.slice(-14).map((item) => (
                <div className="dashboard-bar-column" key={item.date} title={`${item.date}: ${item.bookings} bookings`}>
                  <span className="dashboard-bar" style={{ height: `${Math.max((item.bookings / chartMax) * 100, 4)}%` }} />
                  <small>{new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No booking activity" description="Booking activity will appear here." />}
        </article>

        <article className="admin-card quick-links-card">
          <div className="card-heading"><div><h2>Manage platform</h2><p>Quick access</p></div></div>
          <div className="quick-links">
            <Link to="/admin/businesses"><span className="quick-link-icon">⌂</span><span><strong>Businesses</strong><small>{formatNumber(data.businesses.pagination?.total)} total</small></span><b>→</b></Link>
            <Link to="/admin/plans"><span className="quick-link-icon">◇</span><span><strong>Plans & subscriptions</strong><small>{formatNumber(data.plans?.length)} plans</small></span><b>→</b></Link>
            <Link to="/admin/users"><span className="quick-link-icon">♙</span><span><strong>Users</strong><small>{formatNumber(data.users.pagination?.total)} total</small></span><b>→</b></Link>
            <Link to="/admin/categories"><span className="quick-link-icon">▦</span><span><strong>Categories</strong><small>{formatNumber(data.categories?.length)} active</small></span><b>→</b></Link>
          </div>
        </article>

        <article className="admin-card dashboard-table-card">
          <div className="card-heading"><div><h2>Recent businesses</h2><p>Latest registered businesses</p></div><Link to="/admin/businesses">View all <span aria-hidden="true">→</span></Link></div>
          {data.businesses.data?.length ? (
            <div className="table-wrap"><table className="admin-table"><thead><tr><th>Business</th><th>Category</th><th>Status</th></tr></thead><tbody>
              {data.businesses.data.slice(0, 5).map((business) => <tr key={business.id}><td><strong>{business.name}</strong><small>{business.owner?.name || "No owner"}</small></td><td>{business.category?.name || "—"}</td><td><StatusBadge value={business.status} /></td></tr>)}
            </tbody></table></div>
          ) : <EmptyState title="No businesses yet" />}
        </article>

        <article className="admin-card dashboard-status-card">
          <div className="card-heading"><div><h2>Booking status</h2><p>Current report totals</p></div></div>
          <div className="status-summary">{Object.entries(data.report?.bookingsByStatus || {}).map(([status, count]) => <div key={status}><StatusBadge value={status} /><strong>{formatNumber(count)}</strong></div>)}</div>
          {!Object.keys(data.report?.bookingsByStatus || {}).length && <EmptyState title="No bookings yet" />}
        </article>
      </section>
    </>
  );
}
