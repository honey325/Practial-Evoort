import { Link } from "react-router-dom";
import { businessOwnerApi } from "../api/businessOwner.api.js";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { StatusBadge } from "../../admin/components/StatusBadge.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import { OwnerBusinessRequired } from "../components/OwnerBusinessRequired.jsx";

function count(value) { return new Intl.NumberFormat().format(Number(value || 0)); }

function OverviewContent({ business }) {
  const { data, loading, error, reload } = useAdminData(async () => {
    const [report, services, staff, bookings] = await Promise.all([
      businessOwnerApi.report(business.id, {}),
      businessOwnerApi.services(business.id),
      businessOwnerApi.staff(business.id),
      businessOwnerApi.bookings(business.id, { page: 1, limit: 6 }),
    ]);
    return { report: report.data, services: services.data || [], staff: staff.data || [], bookings };
  }, [business.id]);

  if (loading) return <LoadingState label="Loading business overview..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const totals = data.report?.totals || {};
  const metrics = [
    ["Bookings", totals.bookings, "All time", "▣"],
    ["Revenue", Number(totals.revenue || 0), "Confirmed and completed", "↗"],
    ["Services", data.services.length, "Listed services", "◇"],
    ["Staff", data.staff.length, "Team members", "♙"],
  ];

  return (
    <>
      <section className="owner-summary-grid">{metrics.map(([label, value, note, icon]) => <article className="metric-card" key={label}><div className="metric-topline"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong>{count(value)}</strong><small>{note}</small></article>)}</section>
      <section className="owner-dashboard-grid">
        <article className="admin-card"><div className="card-heading"><div><h2>Recent appointments</h2><p>Latest customer bookings</p></div><Link to="/business-owner/appointments">View all →</Link></div>
          {data.bookings.data?.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Services and staff</th><th>Time</th><th>Status</th></tr></thead><tbody>{data.bookings.data.map((booking) => <tr key={booking.id}><td><strong>{booking.customer?.name || "Customer"}</strong><small>{booking.bookingNumber}</small></td><td><div className="appointment-item-list">{booking.items?.map((item) => <div key={item.id}><strong>{item.service?.name || "Service"}</strong><small>{item.staff?.user?.name || item.staff?.name || "Unassigned"}{item.staff?.designation ? ` · ${item.staff.designation}` : ""}</small></div>)}</div></td><td>{booking.items?.[0]?.startTime ? new Date(booking.items[0].startTime).toLocaleString() : "—"}</td><td><StatusBadge value={booking.status} /></td></tr>)}</tbody></table></div> : <EmptyState title="No appointments yet" />}
        </article>
        <article className="admin-card"><div className="card-heading"><div><h2>Business profile</h2><p>Currently selected business</p></div><Link to="/business-owner/profile">Edit →</Link></div><div className="owner-profile-overview"><div><span>Business name</span><strong>{business.name}</strong></div><div><span>Category</span><strong>{business.category?.name || "—"}</strong></div><div><span>Location</span><strong>{[business.city, business.state].filter(Boolean).join(", ") || "—"}</strong></div><div><span>Contact email</span><strong>{business.email || "—"}</strong></div></div></article>
      </section>
    </>
  );
}

export function OwnerDashboardPage() {
  const { selectedBusiness } = useOwnerWorkspace();
  return <><PageHeader eyebrow="Workspace" title={selectedBusiness?.name || "Overview"} description="Manage your services, team, and appointments." /><OwnerBusinessRequired>{selectedBusiness && <OverviewContent business={selectedBusiness} />}</OwnerBusinessRequired></>;
}
