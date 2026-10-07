import { useState } from "react";
import { businessOwnerApi } from "../api/businessOwner.api.js";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import { OwnerBusinessRequired } from "../components/OwnerBusinessRequired.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { Modal } from "../../admin/components/Modal.jsx";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { StatusBadge } from "../../admin/components/StatusBadge.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

function ServiceForm({ service, categories, onSubmit, onCancel, saving, error }) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="admin-field"><span>Service name</span><input name="name" defaultValue={service?.name || ""} minLength={2} maxLength={150} required /></label>
      <label className="admin-field"><span>Description <small>Optional</small></span><textarea name="description" defaultValue={service?.description || ""} maxLength={5000} rows={3} /></label>
      <div className="admin-form-row three-col">
        <label className="admin-field"><span>Duration (minutes)</span><input name="durationMinutes" type="number" min="1" max="1440" defaultValue={service?.durationMinutes || 30} required /></label>
        <label className="admin-field"><span>Price</span><input name="basePrice" type="number" min="0" max="99999999.99" step="0.01" defaultValue={service?.basePrice ?? ""} required /></label>
        <label className="admin-field"><span>Capacity</span><input name="capacity" type="number" min="1" max="1000" defaultValue={service?.capacity || 1} required /></label>
      </div>
      <label className="admin-field"><span>Category</span><select name="categoryId" defaultValue={service?.categoryId ?? ""}><option value="">No category</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      {service?.id && <label className="admin-field"><span>Status</span><select name="status" defaultValue={service.status}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>}
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary button-auto" type="submit" disabled={saving}>{saving ? "Saving..." : service?.id ? "Save changes" : "Add service"}</button></div>
    </form>
  );
}

export function ServicesPage() {
  const { selectedBusiness } = useOwnerWorkspace();
  const { data, loading, error, reload } = useAdminData(async () => {
    if (!selectedBusiness) return null;
    const [services, categories] = await Promise.all([businessOwnerApi.services(selectedBusiness.id), businessOwnerApi.categories()]);
    return { services: services.data || [], categories: categories.data || [] };
  }, [selectedBusiness?.id]);
  const [activeService, setActiveService] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function submitService(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    const description = form.get("description");
    const payload = {
      name: form.get("name"),
      description: description ? description : activeService?.id ? null : undefined,
      durationMinutes: Number(form.get("durationMinutes")),
      basePrice: Number(form.get("basePrice")),
      capacity: Number(form.get("capacity")),
      categoryId: form.get("categoryId") ? Number(form.get("categoryId")) : null,
    };
    if (activeService?.id) payload.status = form.get("status");
    try {
      if (activeService?.id) await businessOwnerApi.updateService(selectedBusiness.id, activeService.id, payload);
      else await businessOwnerApi.createService(selectedBusiness.id, payload);
      setActiveService(null);
      setNotice(activeService?.id ? "Service updated." : "Service created.");
      await reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeService(service) {
    if (!window.confirm(`Remove ${service.name}?`)) return;
    try {
      await businessOwnerApi.deleteService(selectedBusiness.id, service.id);
      setNotice("Service removed.");
      await reload();
    } catch (requestError) { setNotice(requestError.message); }
  }

  return <OwnerBusinessRequired>
    <PageHeader eyebrow="Offerings" title="Services" description="Create and manage services customers can book." action={<button className="button button-primary button-auto" onClick={() => { setFormError(""); setActiveService({}); }}>Add service <span aria-hidden="true">+</span></button>} />
    {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    <section className="admin-card">
      <div className="card-heading"><div><h2>{selectedBusiness?.name}</h2><p>{data?.services?.length || 0} services</p></div></div>
      {loading ? <LoadingState label="Loading services..." /> : error ? <ErrorState message={error} onRetry={reload} /> : data?.services?.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Service</th><th>Category</th><th>Duration</th><th>Price</th><th>Status</th><th>Manage</th></tr></thead><tbody>{data.services.map((service) => <tr key={service.id}><td><strong>{service.name}</strong><small>{service.description || "No description"}</small></td><td>{service.category?.name || "—"}</td><td>{service.durationMinutes} min</td><td>{Number(service.basePrice).toLocaleString("en-IN")}</td><td><StatusBadge value={service.status} /></td><td><div className="row-actions"><button className="text-action" onClick={() => { setFormError(""); setActiveService(service); }}>Edit</button><button className="text-action text-action-danger" onClick={() => removeService(service)}>Remove</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No services yet" description="Add the services customers can book at this business." />}
    </section>
    {activeService && <Modal title={activeService.id ? "Edit service" : "Add service"} onClose={() => setActiveService(null)}><ServiceForm service={activeService} categories={data?.categories || []} onSubmit={submitService} onCancel={() => setActiveService(null)} saving={saving} error={formError} /></Modal>}
  </OwnerBusinessRequired>;
}
