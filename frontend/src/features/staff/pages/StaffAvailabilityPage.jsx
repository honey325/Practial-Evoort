import { useEffect, useState } from "react";
import { staffApi } from "../api/staff.api.js";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

const weekdays = [{ label: "Monday", value: 1 }, { label: "Tuesday", value: 2 }, { label: "Wednesday", value: 3 }, { label: "Thursday", value: 4 }, { label: "Friday", value: 5 }, { label: "Saturday", value: 6 }, { label: "Sunday", value: 0 }];

function emptySchedule() { return weekdays.map((day) => ({ ...day, intervals: [] })); }
function toSchedule(hours = []) {
  return weekdays.map((day) => ({ ...day, intervals: hours.filter((hour) => hour.dayOfWeek === day.value && hour.isActive).map((hour) => ({ startTime: hour.startTime, endTime: hour.endTime })).slice(0, 2) }));
}

export function StaffAvailabilityPage() {
  const { data, loading, error, reload } = useAdminData(async () => (await staffApi.availability()).data, []);
  const [schedule, setSchedule] = useState(emptySchedule);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { if (data) setSchedule(toSchedule(data)); }, [data]);

  function updateDay(dayValue, updater) { setSchedule((current) => current.map((day) => day.value === dayValue ? updater(day) : day)); }
  function toggleDay(dayValue, isOpen) { updateDay(dayValue, (day) => ({ ...day, intervals: isOpen ? (day.intervals.length ? day.intervals : [{ startTime: "09:00", endTime: "17:00" }]) : [] })); }

  async function saveSchedule(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const hours = schedule.flatMap((day) => day.intervals.map((interval) => ({ dayOfWeek: day.value, startTime: interval.startTime, endTime: interval.endTime, isActive: true })));
    try {
      await staffApi.replaceAvailability(hours);
      setNotice("Availability saved.");
      await reload();
    } catch (requestError) { setFormError(requestError.message); }
    finally { setSaving(false); }
  }

  return <>
    <PageHeader eyebrow="Schedule" title="Manage availability" description="Set the times you can be assigned appointments." />
    <form className="admin-card" onSubmit={saveSchedule}>
      <div className="staff-section-heading"><div><h2>Weekly availability</h2><p>Use up to two intervals per day.</p></div></div>
      {notice && <div className="admin-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      {formError && <p className="form-error staff-inline-error" role="alert">{formError}</p>}
      {loading ? <LoadingState label="Loading availability..." /> : error ? <ErrorState message={error} onRetry={reload} /> : <>
        {schedule.map((day) => <div className="staff-availability-row" key={day.value}>
          <strong className="staff-day">{day.label}</strong>
          {day.intervals.length ? <div className="staff-availability-periods">{day.intervals.map((interval, index) => <div className="staff-availability-period" key={`${day.value}-${index}`}>
            <label className="staff-time-field"><span>From</span><input type="time" value={interval.startTime} onChange={(event) => updateDay(day.value, (current) => ({ ...current, intervals: current.intervals.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item) }))} /></label>
            <label className="staff-time-field"><span>To</span><input type="time" value={interval.endTime} onChange={(event) => updateDay(day.value, (current) => ({ ...current, intervals: current.intervals.map((item, itemIndex) => itemIndex === index ? { ...item, endTime: event.target.value } : item) }))} /></label>
            <button type="button" className="text-action text-action-danger" aria-label={`Remove ${day.label} interval`} onClick={() => updateDay(day.value, (current) => ({ ...current, intervals: current.intervals.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button>
          </div>)}</div> : <span className="staff-closed">Unavailable</span>}
          <div className="staff-day-actions"><label className="staff-switch"><input type="checkbox" checked={day.intervals.length > 0} onChange={(event) => toggleDay(day.value, event.target.checked)} /> Available</label>{day.intervals.length > 0 && day.intervals.length < 2 && <button type="button" className="text-action" onClick={() => updateDay(day.value, (current) => ({ ...current, intervals: [...current.intervals, { startTime: "14:00", endTime: "18:00" }] }))}>+ Add interval</button>}</div>
        </div>)}
        <div className="staff-save-row"><button className="button button-primary button-auto" type="submit" disabled={saving}>{saving ? "Saving..." : "Save availability"}</button></div>
      </>}
    </form>
  </>;
}
