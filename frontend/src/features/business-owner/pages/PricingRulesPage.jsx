import { useState } from "react";
import { businessOwnerApi } from "../api/businessOwner.api.js";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import { OwnerBusinessRequired } from "../components/OwnerBusinessRequired.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { Modal } from "../../admin/components/Modal.jsx";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { StatusBadge } from "../../admin/components/StatusBadge.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

function localDatetime(value) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function RuleForm({ rule, services, staff, onSubmit, onCancel, saving, error }) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="admin-field"><span>Rule name</span><input name="name" defaultValue={rule?.name || ""} minLength={2} maxLength={150} required /></label>
      <div className="admin-form-row"><label className="admin-field"><span>Rule type</span><select name="ruleType" defaultValue={rule?.ruleType || "CUSTOM"}><option value="PEAK">Peak</option><option value="OFF_PEAK">Off peak</option><option value="COMBINATION">Combination</option><option value="CUSTOM">Custom</option></select></label><label className="admin-field"><span>Priority</span><input name="priority" type="number" min="0" max="10000" defaultValue={rule?.priority ?? 0} required /></label></div>
      <div className="admin-form-row"><label className="admin-field"><span>Adjustment type</span><select name="adjustmentType" defaultValue={rule?.adjustmentType || "PERCENTAGE"}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></label><label className="admin-field"><span>Adjustment value</span><input name="adjustmentValue" type="number" step="0.01" defaultValue={rule?.adjustmentValue ?? ""} required /></label></div>
      <div className="admin-form-row"><label className="admin-field"><span>Service</span><select name="serviceId" defaultValue={rule?.serviceId ?? ""}><option value="">All services</option>{services?.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="admin-field"><span>Staff member</span><select name="staffId" defaultValue={rule?.staffId ?? ""}><option value="">All staff</option>{staff?.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.user?.name || "Staff"}</option>)}</select></label></div>
      <div className="admin-form-row"><label className="admin-field"><span>Starts at <small>Optional</small></span><input name="startDate" type="datetime-local" defaultValue={localDatetime(rule?.startDate)} /></label><label className="admin-field"><span>Ends at <small>Optional</small></span><input name="endDate" type="datetime-local" defaultValue={localDatetime(rule?.endDate)} /></label></div>
      <label className="admin-field"><span>Conditions JSON <small>Optional</small></span><textarea className="conditions-input" name="conditionsJson" rows={4} defaultValue={rule?.conditionsJson ? JSON.stringify(rule.conditionsJson, null, 2) : ""} placeholder={'{"daysOfWeek":[1,2],"startTime":"17:00","endTime":"20:00"}'} /></label>
      <label className="owner-switch"><input type="checkbox" name="isActive" defaultChecked={rule?.isActive ?? true} /> Rule is active</label>
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary button-auto" type="submit" disabled={saving}>{saving ? "Saving..." : rule?.id ? "Save changes" : "Create rule"}</button></div>
    </form>
  );
}

export function PricingRulesPage() {
  const { selectedBusiness } = useOwnerWorkspace();
  const { data, loading, error, reload } = useAdminData(async () => {
    if (!selectedBusiness) return null;
    const [rules, services, staff] = await Promise.all([businessOwnerApi.pricingRules(selectedBusiness.id), businessOwnerApi.services(selectedBusiness.id), businessOwnerApi.staff(selectedBusiness.id)]);
    return { rules: rules.data || [], services: services.data || [], staff: staff.data || [] };
  }, [selectedBusiness?.id]);
  const [activeRule, setActiveRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function submitRule(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    let conditionsJson;
    try {
      const rawConditions = form.get("conditionsJson").trim();
      conditionsJson = rawConditions ? JSON.parse(rawConditions) : null;
      if (conditionsJson !== null && (typeof conditionsJson !== "object" || Array.isArray(conditionsJson))) throw new Error("Conditions must be a JSON object.");
    } catch (requestError) {
      setFormError(requestError instanceof SyntaxError ? "Conditions must be valid JSON." : requestError.message);
      setSaving(false);
      return;
    }
    const dateValue = (name) => form.get(name) ? new Date(form.get(name)).toISOString() : null;
    const payload = {
      name: form.get("name"),
      ruleType: form.get("ruleType"),
      priority: Number(form.get("priority")),
      adjustmentType: form.get("adjustmentType"),
      adjustmentValue: Number(form.get("adjustmentValue")),
      serviceId: form.get("serviceId") ? Number(form.get("serviceId")) : null,
      staffId: form.get("staffId") ? Number(form.get("staffId")) : null,
      conditionsJson,
      isActive: form.get("isActive") === "on",
      startDate: dateValue("startDate"),
      endDate: dateValue("endDate"),
    };
    try {
      if (activeRule?.id) await businessOwnerApi.updatePricingRule(selectedBusiness.id, activeRule.id, payload);
      else await businessOwnerApi.createPricingRule(selectedBusiness.id, payload);
      setActiveRule(null);
      setNotice(activeRule?.id ? "Pricing rule updated." : "Pricing rule created.");
      await reload();
    } catch (requestError) { setFormError(requestError.message); }
    finally { setSaving(false); }
  }

  async function changeRuleState(rule) {
    try {
      await businessOwnerApi.updatePricingRule(selectedBusiness.id, rule.id, { isActive: !rule.isActive });
      setNotice(`Pricing rule ${rule.isActive ? "paused" : "activated"}.`);
      await reload();
    } catch (requestError) { setNotice(requestError.message); }
  }

  async function removeRule(rule) {
    if (!window.confirm(`Delete the ${rule.name} pricing rule?`)) return;
    try {
      await businessOwnerApi.deletePricingRule(selectedBusiness.id, rule.id);
      setNotice("Pricing rule deleted.");
      await reload();
    } catch (requestError) { setNotice(requestError.message); }
  }

  return <OwnerBusinessRequired>
    <PageHeader eyebrow="Revenue" title="Dynamic pricing rules" description="Adjust pricing for selected services, staff, and time conditions." action={<button className="button button-primary button-auto" onClick={() => { setFormError(""); setActiveRule({}); }}>Add rule <span aria-hidden="true">+</span></button>} />
    {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    <section className="admin-card"><div className="card-heading"><div><h2>{selectedBusiness?.name}</h2><p>Rules run in priority order</p></div></div>
      {loading ? <LoadingState label="Loading pricing rules..." /> : error ? <ErrorState message={error} onRetry={reload} /> : data?.rules?.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Rule</th><th>Applies to</th><th>Adjustment</th><th>Priority</th><th>Status</th><th>Manage</th></tr></thead><tbody>{data.rules.map((rule) => {
        const serviceName = data.services.find((service) => service.id === rule.serviceId)?.name;
        const staffName = data.staff.find((member) => member.id === rule.staffId)?.user?.name;
        return <tr key={rule.id}><td><strong>{rule.name}</strong><small>{rule.ruleType.replaceAll("_", " ")}</small></td><td>{[serviceName, staffName].filter(Boolean).join(" · ") || "All services and staff"}</td><td>{rule.adjustmentType === "PERCENTAGE" ? `${rule.adjustmentValue}%` : Number(rule.adjustmentValue).toLocaleString("en-IN")}</td><td>{rule.priority}</td><td><StatusBadge value={rule.isActive ? "ACTIVE" : "INACTIVE"} /></td><td><div className="row-actions"><button className="text-action" onClick={() => { setFormError(""); setActiveRule(rule); }}>Edit</button><button className="text-action" onClick={() => changeRuleState(rule)}>{rule.isActive ? "Pause" : "Activate"}</button><button className="text-action text-action-danger" onClick={() => removeRule(rule)}>Delete</button></div></td></tr>;
      })}</tbody></table></div> : <EmptyState title="No pricing rules" description="Create a rule to set peak, off-peak, or custom price adjustments." />}
    </section>
    {activeRule && <Modal title={activeRule.id ? "Edit pricing rule" : "Create pricing rule"} onClose={() => setActiveRule(null)} size="large"><RuleForm rule={activeRule} services={data?.services || []} staff={data?.staff || []} onSubmit={submitRule} onCancel={() => setActiveRule(null)} saving={saving} error={formError} /></Modal>}
  </OwnerBusinessRequired>;
}
