import { useState } from "react";
import { Link } from "react-router-dom";
import { customerApi } from "../api/customer.api.js";
import { BusinessCard } from "../components/BusinessCard.jsx";
import { PageHeader } from "../../admin/components/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../admin/components/AdminState.jsx";
import { Pagination } from "../../admin/components/Pagination.jsx";
import { useAdminData } from "../../admin/hooks/useAdminData.js";

const PAGE_SIZE = 12;

export function BusinessSearchPage() {
  const [filters, setFilters] = useState({ search: "", city: "" });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAdminData(() => customerApi.businesses({ ...applied, page, limit: PAGE_SIZE }), [applied, page]);
  return <>
    <PageHeader eyebrow="Discover" title="Find a business" description="Search local businesses and explore their services." />
    <section className="admin-card customer-search-card">
      <form className="customer-search-form" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied(filters); }}>
        <label className="admin-field customer-search-input"><span>Business or service</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Name, service, or keyword" /></label>
        <label className="admin-field"><span>City</span><input value={filters.city} onChange={(event) => setFilters({ ...filters, city: event.target.value })} placeholder="Any city" /></label>
        <button className="button button-primary button-auto" type="submit">Search</button>
      </form>
    </section>
    {loading ? <LoadingState label="Finding businesses..." /> : error ? <section className="admin-card"><ErrorState message={error} onRetry={reload} /></section> : data?.data?.length ? <>
      <div className="customer-results-heading"><strong>{data.pagination?.total ?? data.data.length} businesses</strong><Link to="/customer/bookings">View your bookings</Link></div>
      <div className="customer-business-grid">{data.data.map((business) => <BusinessCard key={business.id} business={business} />)}</div>
      <Pagination page={data.pagination?.page || page} totalPages={data.pagination?.totalPages} onChange={setPage} />
    </> : <section className="admin-card"><EmptyState title="No businesses found" description="Try a different name or city." /></section>}
  </>;
}
