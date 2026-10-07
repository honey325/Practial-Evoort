import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import "../../admin/admin.css";
import "../customer.css";

const navigation = [
  { label: "Find a business", path: "/customer/businesses", icon: "⌕" },
  { label: "Booking history", path: "/customer/bookings", icon: "▤" },
];

export function CustomerLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = pathname.includes("bookings") ? "Booking history" : pathname.includes("businesses/") ? "Business details" : "Find a business";
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "CU";

  return <div className="customer-app">
    {menuOpen && <button className="admin-sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`customer-sidebar ${menuOpen ? "is-open" : ""}`}>
      <div className="admin-brand"><span className="admin-brand-icon">B</span><span>Bookly<span className="admin-brand-suffix">CUSTOMER</span></span></div>
      <p className="sidebar-label">YOUR ACCOUNT</p>
      <nav className="admin-navigation" aria-label="Customer navigation">
        {navigation.map((item) => <NavLink key={item.path} to={item.path} onClick={() => setMenuOpen(false)} className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom"><div className="admin-profile"><span className="profile-avatar">{initials}</span><span className="profile-copy"><strong>{user?.name || "Customer"}</strong><small>Customer</small></span></div><button className="sidebar-signout" onClick={() => signOut().catch(() => {}).finally(() => navigate("/login", { replace: true }))}>Sign out</button></div>
    </aside>
    <main className="customer-main"><header className="admin-topbar"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>☰</button><div><span className="topbar-section">BOOKLY</span><span className="topbar-divider">/</span><strong>{title}</strong></div><span className="topbar-avatar" title={user?.name}>{initials}</span></header><div className="admin-page"><Outlet /></div></main>
  </div>;
}
