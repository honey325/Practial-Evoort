import { useState } from "react";
import { adminApi } from "../api/admin.api.js";
import { EmptyState, ErrorState, LoadingState } from "../components/AdminState.jsx";
import { Modal } from "../components/Modal.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { useAdminData } from "../hooks/useAdminData.js";

function CategoryForm({ category, onSubmit, saving, error }) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="admin-field"><span>Category name</span><input name="name" defaultValue={category?.name || ""} minLength={2} maxLength={100} required /></label>
      <label className="admin-field"><span>Description <small>Optional</small></span><textarea name="description" defaultValue={category?.description || ""} rows={4} maxLength={5000} /></label>
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={category?.onCancel}>Cancel</button><button className="button button-primary button-auto" type="submit" disabled={saving}>{saving ? "Saving..." : category ? "Save changes" : "Create category"}</button></div>
    </form>
  );
}

export function CategoriesPage() {
  const { data, loading, error, reload } = useAdminData(async () => (await adminApi.categories()).data, []);
  const [activeCategory, setActiveCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    const description = form.get("description");
    const payload = { name: form.get("name"), description: activeCategory?.id ? (description || null) : (description || undefined) };
    try {
      if (activeCategory?.id) await adminApi.updateCategory(activeCategory.id, payload);
      else await adminApi.createCategory(payload);
      setActiveCategory(null);
      setNotice(activeCategory?.id ? "Category updated." : "Category created.");
      await reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(category) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    setNotice("");
    try {
      await adminApi.deleteCategory(category.id);
      setNotice("Category deleted.");
      await reload();
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Catalog" title="Categories" description="Organize the services offered across the platform." action={<button className="button button-primary button-auto" onClick={() => { setFormError(""); setActiveCategory({}); }}>Add category <span aria-hidden="true">+</span></button>} />
      {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      {loading ? <LoadingState label="Loading categories..." /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <section className="admin-card">
          <div className="card-heading"><div><h2>Active categories</h2><p>{data?.length || 0} categories</p></div></div>
          {data?.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Category</th><th>Description</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {data.map((category) => <tr key={category.id}><td><strong>{category.name}</strong></td><td className="cell-description">{category.description || "—"}</td><td><div className="row-actions"><button className="text-action" onClick={() => { setFormError(""); setActiveCategory(category); }}>Edit</button><button className="text-action text-action-danger" onClick={() => removeCategory(category)}>Delete</button></div></td></tr>)}
          </tbody></table></div> : <EmptyState title="No categories yet" description="Add a category to organize business services." />}
        </section>
      )}
      {activeCategory && <Modal title={activeCategory.id ? "Edit category" : "Add category"} onClose={() => setActiveCategory(null)}>
        <CategoryForm category={{ ...activeCategory, onCancel: () => setActiveCategory(null) }} onSubmit={handleSubmit} saving={saving} error={formError} />
      </Modal>}
    </>
  );
}
