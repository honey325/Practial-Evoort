import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi } from "../api/customer.api.js";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

function localDateTimeValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function BusinessDetailPage() {
  const { businessId } = useParams();
  const { data: result, loading, error, reload } = useAdminData(() => customerApi.business(businessId), [businessId]);
  const business = result?.data;
  const [selected, setSelected] = useState([]);
  const [startAt, setStartAt] = useState("");
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const services = business?.services || [];
  const selectedServices = useMemo(() => services.filter((service) => selected.includes(service.id)), [services, selected]);

  function toggleService(serviceId) {
    setSelected((current) => current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]);
    setPreview(null);
    setNotice("");
  }

  async function checkAvailability(event) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await customerApi.previewBooking({ businessId: Number(businessId), serviceIds: selected, startAt: new Date(startAt).toISOString() });
      setPreview(response.data);
    } catch (requestError) { setPreview(null); setNotice(requestError.message); }
    finally { setBusy(false); }
  }

  async function confirmBooking() {
    setBusy(true); setNotice("");
    try {
      const response = await customerApi.createBooking({ businessId: Number(businessId), serviceIds: selected, startAt: new Date(startAt).toISOString() });
      setNotice(`Booking ${response.data.bookingNumber} confirmed.`);
      setPreview(null); setSelected([]); setStartAt("");
    } catch (requestError) { setNotice(requestError.message); }
    finally { setBusy(false); }
  }

  if (loading) return <LoadingState label="Loading business..." />;
  if (error) return <section className="admin-card"><ErrorState message={error} onRetry={reload} /></section>;
  if (!business) return null;

  return <>
    <PageHeader eyebrow={business.category?.name || "Business"} title={business.name} description={[business.address, business.city, business.state, business.country].filter(Boolean).join(", ")} action={<Link className="button button-secondary button-auto" to="/customer/businesses">Back to search</Link>} />
    {business.description && <p className="customer-detail-description">{business.description}</p>}
    {notice && <div className="admin-notice" role="status">{notice}</div>}
    <div className="customer-detail-grid">
      <section className="admin-card"><div className="card-heading"><div><h2>Services</h2><p>Select one or more services for a single booking.</p></div></div>
        {services.length ? <div className="customer-service-list">{services.map((service) => <label className={`customer-service${selected.includes(service.id) ? " is-selected" : ""}`} key={service.id}><input type="checkbox" checked={selected.includes(service.id)} onChange={() => toggleService(service.id)} /><span className="customer-service-copy"><strong>{service.name}</strong><small>{service.durationMinutes} min{service.description ? ` · ${service.description}` : ""}</small></span><b>₹{Number(service.basePrice).toFixed(2)}</b></label>)}</div> : <EmptyState title="No services available" />}
      </section>
      <section className="admin-card customer-booking-card"><div className="card-heading"><div><h2>Book an appointment</h2><p>Services are arranged back-to-back from your selected start time.</p></div></div>
        <form className="customer-booking-form" onSubmit={checkAvailability}>
          <label className="admin-field"><span>Start date and time</span><input type="datetime-local" required min={localDateTimeValue(new Date(Date.now() + 60000))} value={startAt} onChange={(event) => { setStartAt(event.target.value); setPreview(null); }} /></label>
          <div className="customer-selection-summary"><span>{selectedServices.length} service{selectedServices.length === 1 ? "" : "s"} selected</span><strong>{selectedServices.reduce((sum, service) => sum + Number(service.basePrice), 0).toLocaleString(undefined, { style: "currency", currency: "INR" })}</strong></div>
          <button className="button button-primary" type="submit" disabled={!selected.length || !startAt || busy}>{busy ? "Checking..." : "Check availability"}</button>
        </form>
        {preview && <div className="customer-preview"><div className="customer-preview-heading"><strong>Available</strong><span>{preview.durationMinutes} min</span></div><p>{new Date(preview.startAt).toLocaleString()} – {new Date(preview.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p><div className="customer-preview-items">{preview.items.map((item, index) => <div key={`${item.serviceId}-${index}`}><span>{selectedServices.find((service) => service.id === item.serviceId)?.name || "Service"}</span><strong>₹{Number(item.finalPrice).toFixed(2)}</strong></div>)}</div><div className="customer-preview-total"><span>Total</span><strong>₹{Number(preview.totalPrice).toFixed(2)}</strong></div><button className="button button-primary" onClick={confirmBooking} disabled={busy}>Confirm booking</button></div>}
      </section>
    </div>
  </>;
}
