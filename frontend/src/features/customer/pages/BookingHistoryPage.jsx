import { useState } from "react";
import { customerApi } from "../api/customer.api.js";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { Pagination } from "../../admin/components/Pagination.jsx";
import { StatusBadge } from "../../admin/components/StatusBadge.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

const PAGE_SIZE = 10;
const finalStatuses = ["COMPLETED", "CANCELLED", "NO_SHOW"];

function localDateTimeValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function BookingHistoryPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAdminData(() => customerApi.bookings({ page, limit: PAGE_SIZE, status }), [page, status]);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reschedule, setReschedule] = useState(null);

  async function cancel(booking) {
    if (!window.confirm(`Cancel booking ${booking.bookingNumber}?`)) return;
    setBusyId(booking.id); setNotice("");
    try { await customerApi.cancelBooking(booking.id); setNotice(`${booking.bookingNumber} cancelled.`); await reload(); }
    catch (requestError) { setNotice(requestError.message); }
    finally { setBusyId(null); }
  }

  async function submitReschedule(event) {
    event.preventDefault(); setBusyId(reschedule.id); setNotice("");
    try { await customerApi.rescheduleBooking(reschedule.id, new Date(reschedule.startAt).toISOString()); setNotice(`${reschedule.bookingNumber} rescheduled.`); setReschedule(null); await reload(); }
    catch (requestError) { setNotice(requestError.message); }
    finally { setBusyId(null); }
  }

  return <>
    <PageHeader eyebrow="Your account" title="Booking history" description="Review, reschedule, or cancel your appointments." />
    {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    <section className="admin-card">
      <div className="customer-history-toolbar"><label className="admin-field"><span>Booking status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All bookings</option>{["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><span>{data?.pagination?.total ?? ""} bookings</span></div>
      {loading ? <LoadingState label="Loading booking history..." /> : error ? <ErrorState message={error} onRetry={reload} /> : data?.data?.length ? <>
        <div className="customer-booking-list">{data.data.map((booking) => {
          const earliest = booking.items?.[0]?.startTime;
          const canManage = ["PENDING", "CONFIRMED", "RESCHEDULED"].includes(booking.status);
          return <article className="customer-history-card" key={booking.id}>
            <div className="customer-history-header"><div><span className="customer-category">{booking.business?.name || "Business"}</span><h2>{booking.bookingNumber}</h2></div><StatusBadge value={booking.status} /></div>
            <div className="customer-history-details"><div><span>Appointment</span><strong>{earliest ? new Date(earliest).toLocaleString() : "Time unavailable"}</strong></div><div className="customer-history-services"><span>Services and staff</span>{booking.items?.filter((item) => !item.deletedAt).map((item) => <div key={item.id}><strong>{item.service?.name || "Service"}</strong><small>{item.staff?.user?.name || item.staff?.name || "Unassigned"}{item.staff?.designation ? ` · ${item.staff.designation}` : ""}</small></div>) || <strong>—</strong>}</div><div><span>Total</span><strong>₹{Number(booking.totalPrice || 0).toFixed(2)}</strong></div></div>
            {canManage && <div className="customer-booking-actions"><button className="button button-secondary button-small" disabled={busyId === booking.id} onClick={() => setReschedule({ id: booking.id, bookingNumber: booking.bookingNumber, startAt: "" })}>Reschedule</button><button className="text-action text-action-danger" disabled={busyId === booking.id} onClick={() => cancel(booking)}>{busyId === booking.id ? "Updating..." : "Cancel booking"}</button></div>}
            {reschedule?.id === booking.id && <form className="customer-reschedule-form" onSubmit={submitReschedule}><label className="admin-field"><span>New start time</span><input type="datetime-local" required min={localDateTimeValue(new Date(Date.now() + 60000))} value={reschedule.startAt} onChange={(event) => setReschedule({ ...reschedule, startAt: event.target.value })} /></label><button className="button button-primary button-small" disabled={busyId === booking.id}>{busyId === booking.id ? "Saving..." : "Save new time"}</button><button className="button button-quiet button-small" type="button" onClick={() => setReschedule(null)}>Close</button></form>}
          </article>;
        })}</div>
        <Pagination page={data.pagination?.page || page} totalPages={data.pagination?.totalPages} onChange={setPage} />
      </> : <EmptyState title="No bookings yet" description="Your appointments will appear here." />}
    </section>
  </>;
}
