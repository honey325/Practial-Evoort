import { Link } from "react-router-dom";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";

export function OwnerBusinessRequired({ children }) {
  const { selectedBusiness, loading, error, refreshBusinesses } = useOwnerWorkspace();
  if (loading) return <div className="admin-card owner-message">Loading your businesses...</div>;
  if (error) return <div className="admin-card owner-message owner-message-error"><span>{error}</span><button className="button button-secondary button-auto" onClick={() => refreshBusinesses()}>Try again</button></div>;
  if (!selectedBusiness) return <div className="admin-card owner-message"><strong>Add a business to continue</strong><span>Set up a business profile to manage its services and appointments.</span><Link className="button button-primary button-auto" to="/business-owner/profile">Create business profile</Link></div>;
  return children;
}
