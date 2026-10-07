import { Link } from "react-router-dom";
import { staffApi } from "../api/staff.api.js";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { StatusBadge } from "../../admin/components/StatusBadge.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

function AppointmentItems({ items = [] }) {
  return <div className="staff-appointment-items">{items.map((item) => <div key={item.id}><strong>{item.service?.name || "Service"}</strong><small>{item.staff?.user?.name || item.staff?.name || "You"} · {new Date(item.startTime).toLocaleString()}</small></div>)}</div>;
}

export function StaffOverviewPage() {
  const { data, loading, error, reload } = useAdminData(async () => {
    const result = await staffApi.appointments({ page: 1, limit: 5, from: new Date().toISOString() });
    return result;
  }, []);

  return <>
    <PageHeader eyebrow="Staff workspace" title="Overview" description="Your upcoming assigned appointments." action={<Link className="button button-primary button-auto" to="/staff/appointments">View appointments</Link>} />
    {loading ? <LoadingState label="Loading appointments..." /> : error ? <ErrorState message={error} onRetry={reload} /> : <>
      <section className="metric-grid staff-summary-grid">
        <article className="metric-card"><div className="metric-topline"><span>Upcoming appointments</span><span className="metric-icon">▣</span></div><strong>{new Intl.NumberFormat().format(data?.pagination?.total || 0)}</strong><small>Assigned to you</small></article>
      </section>
      <section className="staff-dashboard-grid">
        <article className="admin-card"><div className="card-heading"><div><h2>Next appointments</h2><p>Upcoming appointments assigned to you</p></div><Link to="/staff/appointments">See all →</Link></div>
          {data?.data?.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Appointment</th><th>Business</th><th>Services</th><th>Status</th></tr></thead><tbody>{data.data.map((booking) => <tr key={booking.id}><td><strong>{booking.bookingNumber}</strong><small>{booking.customer?.name || "Customer"}</small></td><td>{booking.business?.name || "—"}</td><td><AppointmentItems items={booking.items} /></td><td><StatusBadge value={booking.status} /></td></tr>)}</tbody></table></div> : <EmptyState title="No upcoming appointments" description="New bookings assigned to you will appear here." />}
        </article>
        <article className="admin-card"><div className="card-heading"><div><h2>Availability</h2><p>Keep your schedule up to date</p></div></div><div className="staff-overview-note"><strong>Manage your weekly availability</strong><span>Set the days and times when you can accept appointments.</span><Link className="text-link" to="/staff/availability">Edit availability →</Link></div></article>
      </section>
    </>}
  </>;
}
