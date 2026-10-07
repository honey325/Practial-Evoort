import { useState } from "react";
import { adminApi } from "../api/admin.api.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/AdminState.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useAdminData } from "../hooks/useAdminData.js";

const initialFilters = { from: "", to: "" };

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function ReportsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const { data, loading, error, reload } = useAdminData(async () => (await adminApi.report(appliedFilters)).data, [appliedFilters]);
  const daily = data?.daily || [];
  const maxBookings = Math.max(...daily.map((item) => item.bookings), 1);
  const maxRevenue = Math.max(...daily.map((item) => item.revenue), 1);

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Reports" description="Platform bookings, revenue, and user activity." />
      <form className="report-filter admin-card" onSubmit={(event) => { event.preventDefault(); setAppliedFilters(filters); }}>
        <label className="admin-field"><span>From</span><input type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
        <label className="admin-field"><span>To</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
        <button className="button button-primary button-auto" type="submit">Apply filters</button>
        <button className="button button-secondary button-auto" type="button" onClick={() => { setFilters(initialFilters); setAppliedFilters(initialFilters); }}>Clear</button>
      </form>

      {loading ? <LoadingState label="Loading reports..." /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <section className="metric-grid report-metrics">
            <article className="metric-card"><div className="metric-topline"><span>Total bookings</span><span className="metric-icon">▣</span></div><strong>{formatNumber(data?.totals?.bookings)}</strong><small>For this date range</small></article>
            <article className="metric-card"><div className="metric-topline"><span>Revenue</span><span className="metric-icon">↗</span></div><strong>{formatNumber(data?.totals?.revenue)}</strong><small>Confirmed and completed bookings</small></article>
            <article className="metric-card"><div className="metric-topline"><span>Businesses</span><span className="metric-icon">⌂</span></div><strong>{formatNumber(data?.totals?.businesses)}</strong><small>Active platform records</small></article>
            <article className="metric-card"><div className="metric-topline"><span>Users</span><span className="metric-icon">♙</span></div><strong>{formatNumber(Object.values(data?.usersByRole || {}).reduce((total, count) => total + count, 0))}</strong><small>Across all account roles</small></article>
          </section>
          <section className="reports-grid">
            <article className="admin-card report-chart-card">
              <div className="card-heading"><div><h2>Booking volume</h2><p>Bookings created per day</p></div></div>
              {daily.length ? <div className="report-bars">{daily.map((item) => <div className="report-bar-column" key={item.date} title={`${item.date}: ${item.bookings} bookings`}><span className="report-bar" style={{ height: `${Math.max((item.bookings / maxBookings) * 100, 3)}%` }} /><small>{new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small></div>)}</div> : <EmptyState title="No activity in this range" />}
            </article>
            <article className="admin-card report-chart-card">
              <div className="card-heading"><div><h2>Revenue trend</h2><p>Daily confirmed and completed revenue</p></div></div>
              {daily.length ? <div className="report-bars revenue-bars">{daily.map((item) => <div className="report-bar-column" key={item.date} title={`${item.date}: ${formatNumber(item.revenue)}`}><span className="report-bar" style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, 3)}%` }} /><small>{new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small></div>)}</div> : <EmptyState title="No revenue in this range" />}
            </article>
          </section>
          <section className="reports-grid reports-bottom-grid">
            <article className="admin-card"><div className="card-heading"><div><h2>Bookings by status</h2><p>Distribution in this range</p></div></div><div className="status-summary">{Object.entries(data?.bookingsByStatus || {}).map(([status, count]) => <div key={status}><StatusBadge value={status} /><strong>{formatNumber(count)}</strong></div>)}</div>{!Object.keys(data?.bookingsByStatus || {}).length && <EmptyState title="No booking data" />}</article>
            <article className="admin-card"><div className="card-heading"><div><h2>Users by role</h2><p>Registered user accounts</p></div></div><div className="status-summary">{Object.entries(data?.usersByRole || {}).map(([role, count]) => <div key={role}><StatusBadge value={role} /><strong>{formatNumber(count)}</strong></div>)}</div></article>
          </section>
        </>
      )}
    </>
  );
}
