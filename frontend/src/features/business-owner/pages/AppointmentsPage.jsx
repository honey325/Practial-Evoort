import { useState } from "react";
import { businessOwnerApi } from "../api/businessOwner.api.js";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import { OwnerBusinessRequired } from "../components/OwnerBusinessRequired.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { Pagination } from "../../admin/components/Pagination.jsx";
import { StatusBadge } from "../../admin/components/StatusBadge.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

const PAGE_SIZE = 10;
const statuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW"];

function datetimeBounds(filters) {
  return {
    from: filters.from ? `${filters.from}T00:00:00.000Z` : "",
    to: filters.to ? `${filters.to}T23:59:59.999Z` : "",
  };
}

function AppointmentItems({ items = [] }) {
  return <div className="appointment-item-list">{items.map((item) => <div key={item.id}><strong>{item.service?.name || "Service"}</strong><small>{item.staff?.user?.name || item.staff?.name || "Unassigned"}{item.staff?.designation ? ` · ${item.staff.designation}` : ""} · {new Date(item.startTime).toLocaleString()}</small></div>)}</div>;
}

export function AppointmentsPage() {
  const { selectedBusiness } = useOwnerWorkspace();
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAdminData(async () => {
    if (!selectedBusiness) return null;
    return businessOwnerApi.bookings(selectedBusiness.id, { ...datetimeBounds(appliedFilters), status: appliedFilters.status, page, limit: PAGE_SIZE });
  }, [selectedBusiness?.id, appliedFilters, page]);
  const [notice, setNotice] = useState("");

  async function updateStatus(booking, status) {
    try {
      await businessOwnerApi.updateBookingStatus(selectedBusiness.id, booking.id, status);
      setNotice(`Appointment ${booking.bookingNumber} updated.`);
      await reload();
    } catch (requestError) { setNotice(requestError.message); }
  }

  return <OwnerBusinessRequired>
    <PageHeader eyebrow="Bookings" title="Appointments" description="Review bookings and update their status." />
    {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    <section className="admin-card">
      <form className="owner-filterbar" onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedFilters(filters); }}>
        <label className="admin-field"><span>Status</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
        <label className="admin-field"><span>From date</span><input type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
        <label className="admin-field"><span>To date</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
        <button className="button button-secondary button-auto" type="submit">Apply filters</button>
      </form>
      {loading ? <LoadingState label="Loading appointments..." /> : error ? <ErrorState message={error} onRetry={reload} /> : data?.data?.length ? <>
        <div className="table-wrap"><table className="admin-table"><thead><tr><th>Appointment</th><th>Customer</th><th>Services & staff</th><th>Total</th><th>Status</th><th>Update</th></tr></thead><tbody>{data.data.map((booking) => {
          const terminal = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status);
          return <tr key={booking.id}>
            <td><strong>{booking.bookingNumber}</strong><small>{new Date(booking.bookedAt || booking.createdAt).toLocaleDateString()}</small></td>
            <td><strong>{booking.customer?.name || "Customer"}</strong><small>{booking.customer?.email || booking.customer?.phone || ""}</small></td>
            <td><AppointmentItems items={booking.items} /></td>
            <td>{booking.currency || "INR"} {Number(booking.totalPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
            <td><StatusBadge value={booking.status} /></td>
            <td>{terminal ? <span className="owner-note">Final status</span> : <select aria-label={`Update ${booking.bookingNumber} status`} value={booking.status} onChange={(event) => updateStatus(booking, event.target.value)}><option value={booking.status}>{booking.status.replaceAll("_", " ")}</option><option value="CONFIRMED">Confirmed</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option><option value="NO_SHOW">No show</option></select>}</td>
          </tr>;
        })}</tbody></table></div>
        <Pagination page={data.pagination?.page || page} totalPages={data.pagination?.totalPages} onChange={setPage} />
      </> : <EmptyState title="No appointments found" description="Bookings matching these filters will appear here." />}
    </section>
  </OwnerBusinessRequired>;
}
