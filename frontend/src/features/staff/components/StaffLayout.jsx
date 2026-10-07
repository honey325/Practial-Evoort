import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import "../../admin/admin.css";
import "../staff.css";

const navigation = [
  { label: "Overview", path: "/staff", icon: "◫", end: true },
  { label: "Appointments", path: "/staff/appointments", icon: "▣" },
  { label: "Availability", path: "/staff/availability", icon: "◷" },
];

const titles = {
  "/staff": "Overview",
  "/staff/appointments": "Appointments",
  "/staff/availability": "Availability",
};

export function StaffLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "ST";

  return (
    <div className="staff-app">
      {menuOpen && <button className="admin-sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`staff-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="admin-brand"><span className="staff-brand-icon">B</span><span>Bookly<span className="admin-brand-suffix">STAFF</span></span></div>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="admin-navigation" aria-label="Staff navigation">
          {navigation.map((item) => <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></NavLink>)}
        </nav>
        <div className="sidebar-bottom"><div className="admin-profile"><span className="profile-avatar">{initials}</span><span className="profile-copy"><strong>{user?.name || "Staff member"}</strong><small>Staff</small></span></div><button className="sidebar-signout" onClick={() => signOut().catch(() => {}).finally(() => navigate("/login", { replace: true }))}>Sign out</button></div>
      </aside>
      <main className="staff-main">
        <header className="staff-topbar"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>☰</button><div className="staff-breadcrumb"><span className="staff-topbar-section">WORKSPACE</span><span className="topbar-divider">/</span><strong>{titles[pathname] || "Staff"}</strong></div><span className="topbar-avatar" title={user?.name}>{initials}</span></header>
        <div className="staff-page"><Outlet /></div>
      </main>
    </div>
  );
}
