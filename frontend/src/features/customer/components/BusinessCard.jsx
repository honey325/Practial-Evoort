import { Link } from "react-router-dom";

export function BusinessCard({ business }) {
  return <article className="customer-business-card">
    <div className="customer-business-mark" aria-hidden="true">{business.name?.trim()?.[0]?.toUpperCase() || "B"}</div>
    <div className="customer-business-copy"><span className="customer-category">{business.category?.name || "Business"}</span><h2>{business.name}</h2><p>{[business.city, business.state].filter(Boolean).join(", ") || "Location not listed"}</p>{business.description && <p className="customer-business-description">{business.description}</p>}</div>
    <Link className="button button-secondary button-auto" to={`/customer/businesses/${business.id}`}>View services</Link>
  </article>;
}
