import { useEffect, useState } from "react";
import { businessOwnerApi } from "../api/businessOwner.api.js";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import { OwnerBusinessRequired } from "../components/OwnerBusinessRequired.jsx";
import { ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

const weekdays = [{ label: "Monday", value: 1 }, { label: "Tuesday", value: 2 }, { label: "Wednesday", value: 3 }, { label: "Thursday", value: 4 }, { label: "Friday", value: 5 }, { label: "Saturday", value: 6 }, { label: "Sunday", value: 0 }];

function emptySchedule() {
  return weekdays.map((day) => ({ ...day, intervals: [] }));
}

function toSchedule(hours = []) {
  return weekdays.map((day) => ({
    ...day,
    intervals: hours.filter((hour) => hour.dayOfWeek === day.value && hour.isActive).map((hour) => ({ startTime: hour.startTime, endTime: hour.endTime })).slice(0, 2),
  }));
}

export function WorkingHoursPage() {
  const { selectedBusiness } = useOwnerWorkspace();
  const { data, loading, error, reload } = useAdminData(async () => selectedBusiness ? (await businessOwnerApi.workingHours(selectedBusiness.id)).data : [], [selectedBusiness?.id]);
  const [schedule, setSchedule] = useState(emptySchedule);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { if (data) setSchedule(toSchedule(data)); }, [data]);

  function updateDay(dayValue, updater) {
    setSchedule((current) => current.map((day) => day.value === dayValue ? updater(day) : day));
  }

  function toggleDay(dayValue, isOpen) {
    updateDay(dayValue, (day) => ({ ...day, intervals: isOpen ? (day.intervals.length ? day.intervals : [{ startTime: "09:00", endTime: "17:00" }]) : [] }));
  }

  async function saveSchedule(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const hours = schedule.flatMap((day) => day.intervals.map((interval) => ({ dayOfWeek: day.value, startTime: interval.startTime, endTime: interval.endTime, isActive: true })));
    try {
      await businessOwnerApi.replaceWorkingHours(selectedBusiness.id, hours);
      setNotice("Working hours saved.");
      await reload();
    } catch (requestError) { setFormError(requestError.message); }
    finally { setSaving(false); }
  }

  return <OwnerBusinessRequired>
    <PageHeader eyebrow="Availability" title="Working hours" description="Set the hours customers can book at this business." />
    <form className="admin-card" onSubmit={saveSchedule}>
      <div className="owner-section-heading"><div><h2>{selectedBusiness?.name}</h2><p>Use up to two open intervals per day.</p></div></div>
      {notice && <div className="admin-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      {formError && <p className="form-error owner-inline-error" role="alert">{formError}</p>}
      {loading ? <LoadingState label="Loading working hours..." /> : error ? <ErrorState message={error} onRetry={reload} /> : <>
        {schedule.map((day) => <div className="owner-repeat-row" key={day.value}>
          <strong className="owner-day">{day.label}</strong>
          {day.intervals.length ? <div className="owner-interval-list">{day.intervals.map((interval, index) => <div className="owner-interval" key={`${day.value}-${index}`}>
            <label className="owner-inline-field"><span>Open</span><input type="time" value={interval.startTime} onChange={(event) => updateDay(day.value, (current) => ({ ...current, intervals: current.intervals.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item) }))} /></label>
            <label className="owner-inline-field"><span>Close</span><input type="time" value={interval.endTime} onChange={(event) => updateDay(day.value, (current) => ({ ...current, intervals: current.intervals.map((item, itemIndex) => itemIndex === index ? { ...item, endTime: event.target.value } : item) }))} /></label>
            <button type="button" className="text-action text-action-danger" aria-label={`Remove ${day.label} interval`} onClick={() => updateDay(day.value, (current) => ({ ...current, intervals: current.intervals.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button>
          </div>)}</div> : <span className="owner-closed">Closed</span>}
          <div className="owner-day-actions"><label className="owner-switch"><input type="checkbox" checked={day.intervals.length > 0} onChange={(event) => toggleDay(day.value, event.target.checked)} /> Open</label>{day.intervals.length > 0 && day.intervals.length < 2 && <button type="button" className="text-action" onClick={() => updateDay(day.value, (current) => ({ ...current, intervals: [...current.intervals, { startTime: "14:00", endTime: "18:00" }] }))}>+ Add interval</button>}</div>
        </div>)}
        <div className="owner-save-row"><button className="button button-primary button-auto" type="submit" disabled={saving}>{saving ? "Saving..." : "Save hours"}</button></div>
      </>}
    </form>
  </OwnerBusinessRequired>;
}
