import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import "../admin.css";

const navigation = [
  { label: "Overview", path: "/admin", icon: "◫", end: true },
  { label: "Businesses", path: "/admin/businesses", icon: "⌂" },
  { label: "Subscriptions", path: "/admin/plans", icon: "◇" },
  { label: "Categories", path: "/admin/categories", icon: "▦" },
  { label: "Users", path: "/admin/users", icon: "♙" },
  { label: "Reports", path: "/admin/reports", icon: "▤" },
];

const titles = {
  "/admin": "Overview",
  "/admin/businesses": "Businesses",
  "/admin/plans": "Subscriptions",
  "/admin/categories": "Categories",
  "/admin/users": "Users",
  "/admin/reports": "Reports",
};

export function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = titles[pathname] || "Admin";
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "SA";

  return (
    <div className="admin-app">
      {menuOpen && <button className="admin-sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`admin-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="admin-brand">
          <span className="admin-brand-icon">B</span>
          <span>Bookly<span className="admin-brand-suffix">ADMIN</span></span>
        </div>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="admin-navigation" aria-label="Admin navigation">
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-profile">
            <span className="profile-avatar">{initials}</span>
            <span className="profile-copy"><strong>{user?.name || "Administrator"}</strong><small>Super admin</small></span>
          </div>
          <button className="sidebar-signout" onClick={() => navigate("/logout")}>Sign out</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>☰</button>
          <div><span className="topbar-section">ADMINISTRATION</span><span className="topbar-divider">/</span><strong>{title}</strong></div>
          <div className="topbar-avatar" title={user?.name}>{initials}</div>
        </header>
        <div className="admin-page"><Outlet /></div>
      </main>
    </div>
  );
}
