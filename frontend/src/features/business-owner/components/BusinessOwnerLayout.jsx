import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import { useOwnerWorkspace } from "../context/OwnerWorkspaceContext.jsx";
import "../../admin/admin.css";
import "../owner.css";

const navigation = [
  { label: "Overview", path: "/business-owner", icon: "◫", end: true },
  { label: "Business profile", path: "/business-owner/profile", icon: "⌂" },
  { label: "Services", path: "/business-owner/services", icon: "◇" },
  { label: "Staff", path: "/business-owner/staff", icon: "♙" },
  { label: "Working hours", path: "/business-owner/hours", icon: "◷" },
  { label: "Holidays", path: "/business-owner/holidays", icon: "▦" },
  { label: "Appointments", path: "/business-owner/appointments", icon: "▣" },
  { label: "Pricing rules", path: "/business-owner/pricing", icon: "↗" },
];

const titles = {
  "/business-owner": "Overview",
  "/business-owner/profile": "Business profile",
  "/business-owner/services": "Services",
  "/business-owner/staff": "Staff",
  "/business-owner/hours": "Working hours",
  "/business-owner/holidays": "Holidays",
  "/business-owner/appointments": "Appointments",
  "/business-owner/pricing": "Pricing rules",
};

export function BusinessOwnerLayout() {
  const { user, signOut } = useAuth();
  const { businesses, selectedBusinessId, selectBusiness, loading: businessesLoading } = useOwnerWorkspace();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = titles[pathname] || "Workspace";
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "BO";

  return (
    <div className="owner-app">
      {menuOpen && <button className="admin-sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`owner-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="admin-brand"><span className="owner-brand-icon">B</span><span>Bookly<span className="admin-brand-suffix">BUSINESS</span></span></div>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="admin-navigation" aria-label="Business owner navigation">
          {navigation.map((item) => <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-profile"><span className="profile-avatar">{initials}</span><span className="profile-copy"><strong>{user?.name || "Business owner"}</strong><small>Business owner</small></span></div>
          <button className="sidebar-signout" onClick={() => signOut().catch(() => {}).finally(() => navigate("/login", { replace: true }))}>Sign out</button>
        </div>
      </aside>
      <main className="owner-main">
        <header className="owner-topbar">
          <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>☰</button>
          <div className="owner-breadcrumb"><span className="owner-topbar-section">BUSINESS</span><span className="topbar-divider">/</span><strong>{title}</strong></div>
          <label className="business-switcher"><span className="sr-only">Select business</span><select value={selectedBusinessId || ""} disabled={businessesLoading || !businesses.length} onChange={(event) => selectBusiness(event.target.value)}><option value="">{businessesLoading ? "Loading businesses..." : "Select a business"}</option>{businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select></label>
          <span className="topbar-avatar" title={user?.name}>{initials}</span>
        </header>
        <div className="owner-page"><Outlet /></div>
      </main>
    </div>
  );
}
