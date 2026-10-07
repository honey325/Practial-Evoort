import { useState } from "react";
import { adminApi } from "../api/admin.api.js";
import { EmptyState, ErrorState, LoadingState } from "../components/AdminState.jsx";
import { Modal } from "../components/Modal.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { Pagination } from "../components/Pagination.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useAdminData } from "../hooks/useAdminData.js";

const PAGE_SIZE = 10;

function BusinessDetails({ business }) {
  return (
    <div className="detail-grid">
      <div><span>Owner</span><strong>{business.owner?.name || "—"}</strong><small>{business.owner?.email || ""}</small></div>
      <div><span>Category</span><strong>{business.category?.name || "—"}</strong></div>
      <div><span>Contact</span><strong>{business.email || "—"}</strong><small>{business.phone || ""}</small></div>
      <div><span>Location</span><strong>{[business.city, business.state, business.country].filter(Boolean).join(", ") || "—"}</strong><small>{business.address || ""}</small></div>
      <div><span>Services</span><strong>{business._count?.services ?? 0}</strong></div>
      <div><span>Staff</span><strong>{business._count?.staff ?? 0}</strong></div>
      <div><span>Bookings</span><strong>{business._count?.bookings ?? 0}</strong></div>
      <div><span>Created</span><strong>{business.createdAt ? new Date(business.createdAt).toLocaleDateString() : "—"}</strong></div>
      {business.description && <div className="detail-span"><span>Description</span><p>{business.description}</p></div>}
    </div>
  );
}

export function BusinessesPage() {
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAdminData(async () => adminApi.businesses({ ...appliedFilters, page, limit: PAGE_SIZE }), [appliedFilters, page]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function openBusiness(businessId) {
    setDetailLoading(true);
    try {
      const result = await adminApi.business(businessId);
      setSelectedBusiness(result.data);
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(business, status) {
    try {
      await adminApi.updateBusinessStatus(business.id, status);
      await reload();
      setNotice(`${business.name} status updated.`);
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  async function removeBusiness(business) {
    if (!window.confirm(`Remove ${business.name} from the platform?`)) return;
    try {
      await adminApi.deleteBusiness(business.id);
      setNotice("Business removed.");
      await reload();
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Platform" title="Businesses" description="Review business profiles and manage platform access." />
      {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      <section className="admin-card">
        <form className="list-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedFilters(filters); }}>
          <label className="search-field"><span className="sr-only">Search businesses</span><span aria-hidden="true">⌕</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search businesses" /></label>
          <select aria-label="Filter by status" value={filters.status} onChange={(event) => { const next = { ...filters, status: event.target.value }; setFilters(next); setPage(1); setAppliedFilters(next); }}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></select>
          <button className="button button-secondary button-auto" type="submit">Search</button>
        </form>
        {loading ? <LoadingState label="Loading businesses..." /> : error ? <ErrorState message={error} onRetry={reload} /> : data?.data?.length ? (
          <>
            <div className="table-wrap"><table className="admin-table"><thead><tr><th>Business</th><th>Owner</th><th>Category</th><th>Activity</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
              {data.data.map((business) => <tr key={business.id}>
                <td><button className="table-link" onClick={() => openBusiness(business.id)}>{business.name}</button><small>{business.city || business.email || "—"}</small></td>
                <td>{business.owner?.name || "—"}<small>{business.owner?.email || ""}</small></td>
                <td>{business.category?.name || "—"}</td>
                <td className="activity-cell"><span>{business._count?.services ?? 0} services</span><span>{business._count?.staff ?? 0} staff</span></td>
                <td><StatusBadge value={business.status} /></td>
                <td><div className="row-actions"><select aria-label={`Change ${business.name} status`} value={business.status} onChange={(event) => changeStatus(business, event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></select><button className="text-action text-action-danger" onClick={() => removeBusiness(business)}>Remove</button></div></td>
              </tr>)}
            </tbody></table></div>
            <Pagination page={data.pagination?.page || page} totalPages={data.pagination?.totalPages} onChange={setPage} />
          </>
        ) : <EmptyState title="No businesses found" description="Try adjusting the search or status filter." />}
      </section>
      {detailLoading && <Modal title="Business details" size="large" onClose={() => setDetailLoading(false)}><LoadingState label="Loading business..." /></Modal>}
      {selectedBusiness && <Modal title={selectedBusiness.name} size="large" onClose={() => setSelectedBusiness(null)}><BusinessDetails business={selectedBusiness} /></Modal>}
    </>
  );
}
