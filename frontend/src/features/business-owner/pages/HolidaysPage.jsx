import { useState } from "react";
import { businessOwnerApi } from "../api/businessOwner.api.js";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import { OwnerBusinessRequired } from "../components/OwnerBusinessRequired.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { Modal } from "../../admin/components/Modal.jsx";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

function HolidayForm({ onSubmit, onCancel, saving, error }) {
  const [fullDay, setFullDay] = useState(true);
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="admin-field"><span>Holiday name</span><input name="name" minLength={2} maxLength={150} required placeholder="Public holiday" /></label>
      <label className="admin-field"><span>Date</span><input name="holidayDate" type="date" required /></label>
      <label className="owner-switch"><input type="checkbox" name="isFullDay" checked={fullDay} onChange={(event) => setFullDay(event.target.checked)} /> Closed all day</label>
      {!fullDay && <div className="admin-form-row"><label className="admin-field"><span>Start time</span><input name="startTime" type="time" required /></label><label className="admin-field"><span>End time</span><input name="endTime" type="time" required /></label></div>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary button-auto" type="submit" disabled={saving}>{saving ? "Saving..." : "Add holiday"}</button></div>
    </form>
  );
}

export function HolidaysPage() {
  const { selectedBusiness } = useOwnerWorkspace();
  const { data, loading, error, reload } = useAdminData(async () => selectedBusiness ? (await businessOwnerApi.holidays(selectedBusiness.id)).data : [], [selectedBusiness?.id]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function submitHoliday(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    const isFullDay = form.get("isFullDay") === "on";
    const payload = { name: form.get("name"), holidayDate: form.get("holidayDate"), isFullDay };
    if (!isFullDay) { payload.startTime = form.get("startTime"); payload.endTime = form.get("endTime"); }
    try {
      await businessOwnerApi.createHoliday(selectedBusiness.id, payload);
      setCreating(false);
      setNotice("Holiday added.");
      await reload();
    } catch (requestError) { setFormError(requestError.message); }
    finally { setSaving(false); }
  }

  async function removeHoliday(holiday) {
    if (!window.confirm(`Remove ${holiday.name}?`)) return;
    try {
      await businessOwnerApi.deleteHoliday(selectedBusiness.id, holiday.id);
      setNotice("Holiday removed.");
      await reload();
    } catch (requestError) { setNotice(requestError.message); }
  }

  return <OwnerBusinessRequired>
    <PageHeader eyebrow="Availability" title="Holiday management" description="Block full days or set partial holiday hours." action={<button className="button button-primary button-auto" onClick={() => { setFormError(""); setCreating(true); }}>Add holiday <span aria-hidden="true">+</span></button>} />
    {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    <section className="admin-card"><div className="card-heading"><div><h2>{selectedBusiness?.name}</h2><p>{data?.length || 0} upcoming and past holidays</p></div></div>
      {loading ? <LoadingState label="Loading holidays..." /> : error ? <ErrorState message={error} onRetry={reload} /> : data?.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Holiday</th><th>Date</th><th>Hours</th><th>Manage</th></tr></thead><tbody>{data.map((holiday) => <tr key={holiday.id}><td><strong>{holiday.name}</strong></td><td>{new Date(holiday.holidayDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</td><td>{holiday.isFullDay ? "Closed all day" : `${holiday.startTime}–${holiday.endTime}`}</td><td><button className="text-action text-action-danger" onClick={() => removeHoliday(holiday)}>Remove</button></td></tr>)}</tbody></table></div> : <EmptyState title="No holidays scheduled" description="Add holidays when the business will be closed or have reduced hours." />}
    </section>
    {creating && <Modal title="Add holiday" onClose={() => setCreating(false)}><HolidayForm onSubmit={submitHoliday} onCancel={() => setCreating(false)} saving={saving} error={formError} /></Modal>}
  </OwnerBusinessRequired>;
}
