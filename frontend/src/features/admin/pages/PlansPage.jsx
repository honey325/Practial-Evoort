import { useState } from "react";
import { adminApi } from "../api/admin.api.js";
import { EmptyState, ErrorState, LoadingState } from "../components/AdminState.jsx";
import { Modal } from "../components/Modal.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { Pagination } from "../components/Pagination.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useAdminData } from "../hooks/useAdminData.js";

const PAGE_SIZE = 10;
const subscriptionStatuses = ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"];

function PlanForm({ plan, onSubmit, onCancel, saving, error }) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="admin-field"><span>Plan name</span><input name="name" defaultValue={plan?.name || ""} minLength={2} maxLength={100} required /></label>
      <label className="admin-field"><span>Description <small>Optional</small></span><textarea name="description" defaultValue={plan?.description || ""} rows={3} maxLength={5000} /></label>
      <div className="admin-form-row">
        <label className="admin-field"><span>Price</span><input name="price" type="number" defaultValue={plan?.price ?? ""} min="0" max="99999999.99" step="0.01" required /></label>
        <label className="admin-field"><span>Billing cycle</span><select name="billingCycle" defaultValue={plan?.billingCycle || "MONTHLY"}><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></label>
      </div>
      <div className="admin-form-row three-col">
        <label className="admin-field"><span>Staff limit</span><input name="maxStaff" type="number" defaultValue={plan?.maxStaff ?? ""} min="1" placeholder="Unlimited" /></label>
        <label className="admin-field"><span>Service limit</span><input name="maxServices" type="number" defaultValue={plan?.maxServices ?? ""} min="1" placeholder="Unlimited" /></label>
        <label className="admin-field"><span>Monthly bookings</span><input name="maxMonthlyBookings" type="number" defaultValue={plan?.maxMonthlyBookings ?? ""} min="1" placeholder="Unlimited" /></label>
      </div>
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary button-auto" type="submit" disabled={saving}>{saving ? "Saving..." : plan?.id ? "Save changes" : "Create plan"}</button></div>
    </form>
  );
}

function planPayload(form) {
  const value = new FormData(form);
  const optionalLimit = (key) => value.get(key) ? Number(value.get(key)) : null;
  return {
    name: value.get("name"),
    description: value.get("description") || null,
    price: Number(value.get("price")),
    billingCycle: value.get("billingCycle"),
    maxStaff: optionalLimit("maxStaff"),
    maxServices: optionalLimit("maxServices"),
    maxMonthlyBookings: optionalLimit("maxMonthlyBookings"),
  };
}

export function PlansPage() {
  const [tab, setTab] = useState("plans");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, loading, error, reload } = useAdminData(async () => {
    const [plans, subscriptions] = await Promise.all([
      adminApi.plans(),
      adminApi.subscriptions({ page, limit: PAGE_SIZE, status }),
    ]);
    return { plans: plans.data || [], subscriptions };
  }, [page, status]);
  const [activePlan, setActivePlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function handlePlanSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = planPayload(event.currentTarget);
      if (activePlan?.id) await adminApi.updatePlan(activePlan.id, payload);
      else await adminApi.createPlan(payload);
      setActivePlan(null);
      setNotice(activePlan?.id ? "Plan updated." : "Plan created.");
      await reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removePlan(plan) {
    if (!window.confirm(`Delete the ${plan.name} plan?`)) return;
    try {
      await adminApi.deletePlan(plan.id);
      setNotice("Plan deleted.");
      await reload();
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  async function changeSubscriptionStatus(subscription, nextStatus) {
    try {
      await adminApi.updateSubscriptionStatus(subscription.id, nextStatus);
      setNotice("Subscription status updated.");
      await reload();
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Billing" title="Subscriptions" description="Manage subscription plans and business subscriptions." action={tab === "plans" ? <button className="button button-primary button-auto" onClick={() => { setFormError(""); setActivePlan({}); }}>Add plan <span aria-hidden="true">+</span></button> : null} />
      {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      <div className="admin-tabs" role="tablist" aria-label="Subscription management">
        <button className={tab === "plans" ? "active" : ""} role="tab" aria-selected={tab === "plans"} onClick={() => setTab("plans")}>Plans</button>
        <button className={tab === "subscriptions" ? "active" : ""} role="tab" aria-selected={tab === "subscriptions"} onClick={() => setTab("subscriptions")}>Business subscriptions</button>
      </div>
      <section className="admin-card">
        {tab === "subscriptions" && <div className="list-toolbar"><span className="toolbar-count">{data?.subscriptions?.pagination?.total ?? 0} subscriptions</span><select aria-label="Filter subscriptions by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{subscriptionStatuses.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></div>}
        {loading ? <LoadingState label="Loading subscriptions..." /> : error ? <ErrorState message={error} onRetry={reload} /> : tab === "plans" ? (
          data.plans.length ? <div className="plan-grid">{data.plans.map((plan) => <article className="plan-card" key={plan.id}>
            <div className="plan-topline"><StatusBadge value={plan.status ? "ACTIVE" : "INACTIVE"} /><button className="text-action" onClick={() => { setFormError(""); setActivePlan(plan); }}>Edit</button></div>
            <h2>{plan.name}</h2>
            <p className="plan-description">{plan.description || "No description"}</p>
            <p className="plan-price"><strong>{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(plan.price))}</strong><span> / {plan.billingCycle === "YEARLY" ? "year" : "month"}</span></p>
            <div className="plan-limits"><span>{plan.maxStaff ?? "Unlimited"} staff</span><span>{plan.maxServices ?? "Unlimited"} services</span><span>{plan.maxMonthlyBookings ?? "Unlimited"} bookings / month</span></div>
            <button className="text-action text-action-danger plan-delete" onClick={() => removePlan(plan)}>Delete plan</button>
          </article>)}</div> : <EmptyState title="No plans available" description="Create a plan to start managing subscriptions." />
        ) : (
          data.subscriptions?.data?.length ? <>
            <div className="table-wrap"><table className="admin-table"><thead><tr><th>Business</th><th>Plan</th><th>Started</th><th>Ends</th><th>Status</th><th>Manage</th></tr></thead><tbody>
              {data.subscriptions.data.map((subscription) => <tr key={subscription.id}><td><strong>{subscription.business?.name || `Business #${subscription.businessId}`}</strong><small>Subscription #{subscription.id}</small></td><td>{subscription.plan?.name || "—"}</td><td>{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : "—"}</td><td>{subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : "—"}</td><td><StatusBadge value={subscription.status} /></td><td><select aria-label={`Change subscription ${subscription.id} status`} value={subscription.status} onChange={(event) => changeSubscriptionStatus(subscription, event.target.value)}>{subscriptionStatuses.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></td></tr>)}
            </tbody></table></div>
            <Pagination page={data.subscriptions.pagination?.page || page} totalPages={data.subscriptions.pagination?.totalPages} onChange={setPage} />
          </> : <EmptyState title="No subscriptions found" description="Subscriptions will appear here when businesses enroll in a plan." />
        )}
      </section>
      {activePlan && <Modal title={activePlan.id ? "Edit plan" : "Create plan"} onClose={() => setActivePlan(null)} size="large"><PlanForm plan={activePlan} onSubmit={handlePlanSubmit} onCancel={() => setActivePlan(null)} saving={saving} error={formError} /></Modal>}
    </>
  );
}
