import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { businessOwnerApi } from "../api/businessOwner.api.js";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";

function profilePayload(form, isEditing) {
  const value = new FormData(form);
  const details = {
    name: value.get("name"),
    categoryId: Number(value.get("categoryId")),
    timezone: value.get("timezone") || "Asia/Kolkata",
  };
  const optionalFields = ["description", "email", "phone", "address", "city", "state", "country"];
  optionalFields.forEach((field) => {
    const fieldValue = value.get(field);
    if (fieldValue) details[field] = fieldValue;
    else if (isEditing && ["email", "phone", "address", "city", "state", "country"].includes(field)) details[field] = null;
  });
  return details;
}

export function BusinessProfilePage() {
  const { selectedBusiness, businesses, createBusiness, refreshBusinesses, loading: businessLoading } = useOwnerWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(Boolean(location.state?.create));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const { data: categories, loading, error, reload } = useAdminData(async () => (await businessOwnerApi.categories()).data, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const shouldCreate = creating || (!businessLoading && !selectedBusiness);
      const details = profilePayload(event.currentTarget, !shouldCreate);
      if (shouldCreate) {
        await createBusiness(details);
        setCreating(false);
        navigate("/business-owner", { replace: true });
      } else {
        await businessOwnerApi.updateBusiness(selectedBusiness.id, details);
        await refreshBusinesses(selectedBusiness.id);
        setNotice("Business profile saved.");
      }
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (businessLoading && !creating && !location.state?.create) return <LoadingState label="Loading business profile..." />;
  if (loading) return <LoadingState label="Loading profile options..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const shouldCreate = creating || (!businessLoading && !selectedBusiness);
  const business = shouldCreate ? null : selectedBusiness;
  return (
    <>
      <PageHeader eyebrow="Business setup" title={shouldCreate ? "Create a business" : "Business profile"} description={shouldCreate ? "Add the details customers will see when they discover your business." : "Manage your public business details and contact information."} action={businesses.length > 0 && <button className="button button-secondary button-auto" onClick={() => { setCreating(!shouldCreate); setFormError(""); }}>{shouldCreate ? "Cancel" : "Add another business"}</button>} />
      {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      <form key={business?.id || "new-business"} className="admin-card owner-form-layout" onSubmit={handleSubmit}>
        {formError && <p className="form-error full-span" role="alert">{formError}</p>}
        <label className="admin-field"><span>Business name</span><input name="name" defaultValue={business?.name || ""} minLength={2} maxLength={150} required /></label>
        <label className="admin-field"><span>Category</span><select name="categoryId" defaultValue={business?.categoryId || business?.category?.id || ""} required><option value="" disabled>Select a category</option>{categories?.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
        <label className="admin-field full-span"><span>Description</span><textarea name="description" defaultValue={business?.description || ""} rows={4} maxLength={5000} placeholder="What should customers know about your business?" /></label>
        <label className="admin-field"><span>Business email</span><input name="email" type="email" defaultValue={business?.email || ""} maxLength={191} /></label>
        <label className="admin-field"><span>Phone number</span><input name="phone" type="tel" defaultValue={business?.phone || ""} pattern="^[0-9]{10}$" placeholder="+919876543210" /></label>
        <label className="admin-field full-span"><span>Address</span><input name="address" defaultValue={business?.address || ""} maxLength={2000} /></label>
        <label className="admin-field"><span>City</span><input name="city" defaultValue={business?.city || ""} maxLength={100} /></label>
        <label className="admin-field"><span>State or region</span><input name="state" defaultValue={business?.state || ""} maxLength={100} /></label>
        <label className="admin-field"><span>Country</span><input name="country" defaultValue={business?.country || ""} maxLength={100} /></label>
        <label className="admin-field"><span>Timezone</span><input name="timezone" defaultValue={business?.timezone || "Asia/Kolkata"} maxLength={100} required /></label>
        <div className="owner-form-actions"><button className="button button-primary button-auto" type="submit" disabled={saving || businessLoading}>{saving ? "Saving..." : shouldCreate ? "Create business" : "Save profile"}</button></div>
      </form>
    </>
  );
}
