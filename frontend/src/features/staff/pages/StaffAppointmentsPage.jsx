import { useState } from "react";
import { staffApi } from "../api/staff.api.js";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { Pagination } from "../../admin/components/Pagination.jsx";
import { StatusBadge } from "../../admin/components/StatusBadge.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

const PAGE_SIZE = 10;
const filtersList = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW"];
const finalStatuses = ["COMPLETED", "CANCELLED", "NO_SHOW"];

function dateBounds({ from, to }) {
  return { from: from ? `${from}T00:00:00.000Z` : "", to: to ? `${to}T23:59:59.999Z` : "" };
}

function AssignedItems({ items = [] }) {
  return <div className="staff-appointment-items">{items.map((item) => <div key={item.id}><strong>{item.service?.name || "Service"}</strong><small>{new Date(item.startTime).toLocaleString()} · {item.staff?.user?.name || item.staff?.name || "You"}</small><span className="staff-item-state"><StatusBadge value={item.status} /></span></div>)}</div>;
}

export function StaffAppointmentsPage() {
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAdminData(async () => staffApi.appointments({ ...dateBounds(appliedFilters), status: appliedFilters.status, page, limit: PAGE_SIZE }), [appliedFilters, page]);
  const [notice, setNotice] = useState("");

  async function updateStatus(booking, status) {
    try {
      await staffApi.updateAppointmentStatus(booking.id, status);
      setNotice(`Appointment ${booking.bookingNumber} updated.`);
      await reload();
    } catch (requestError) { setNotice(requestError.message); }
  }

  return <>
    <PageHeader eyebrow="Assigned work" title="Appointments" description="View your assigned appointments and update their status." />
    {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    <section className="admin-card">
      <form className="staff-filterbar" onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedFilters(filters); }}>
        <label className="admin-field"><span>Booking status</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{filtersList.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
        <label className="admin-field"><span>From date</span><input type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
        <label className="admin-field"><span>To date</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
        <button className="button button-secondary button-auto" type="submit">Apply filters</button>
      </form>
      {loading ? <LoadingState label="Loading appointments..." /> : error ? <ErrorState message={error} onRetry={reload} /> : data?.data?.length ? <>
        <div className="table-wrap"><table className="admin-table"><thead><tr><th>Booking</th><th>Customer</th><th>Business</th><th>Your appointments</th><th>Booking status</th><th>Update</th></tr></thead><tbody>{data.data.map((booking) => {
          const terminal = finalStatuses.includes(booking.status);
          const items = booking.items || [];
          const alreadyConfirmed = items.length > 0 && items.every((item) => item.status === "CONFIRMED");
          const alreadyCompleted = items.length > 0 && items.every((item) => item.status === "COMPLETED");
          const alreadyNoShow = items.length > 0 && items.every((item) => item.status === "NO_SHOW");
          return <tr key={booking.id}>
            <td><strong>{booking.bookingNumber}</strong><small>{new Date(booking.bookedAt || booking.createdAt).toLocaleDateString()}</small></td>
            <td><strong>{booking.customer?.name || "Customer"}</strong><small>{booking.customer?.email || booking.customer?.phone || ""}</small></td>
            <td>{booking.business?.name || "—"}</td>
            <td><AssignedItems items={items} /></td>
            <td><StatusBadge value={booking.status} /></td>
            <td>{terminal ? <span className="staff-final-status">Final status</span> : <select aria-label={`Update ${booking.bookingNumber}`} value="" onChange={(event) => updateStatus(booking, event.target.value)}><option value="" disabled>Update status</option><option value="CONFIRMED" disabled={alreadyConfirmed}>Confirm</option><option value="COMPLETED" disabled={alreadyCompleted}>Complete</option><option value="NO_SHOW" disabled={alreadyNoShow}>No show</option></select>}</td>
          </tr>;
        })}</tbody></table></div>
        <Pagination page={data.pagination?.page || page} totalPages={data.pagination?.totalPages} onChange={setPage} />
      </> : <EmptyState title="No appointments found" description="Appointments assigned to you will appear here." />}
    </section>
  </>;
}
